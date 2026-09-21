"""Sign-in, session rotation, and password changes.

Refresh tokens rotate on every use. Presenting a token that was already rotated is treated as
evidence of theft, not as a retry, so every session for that account is revoked immediately.

刷新令牌每次使用即轮换。出示已被轮换过的令牌视为失窃证据而非重试，
因此会立即吊销该账号的全部会话。
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config.settings import get_settings
from app.core.errors.exceptions import AuthenticationFailed, ValidationFailed
from app.core.security.passwords import policy
from app.core.security.passwords.hashing import hash_password, needs_rehash, verify_password
from app.core.security.tokens.jwt_codec import issue_access_token
from app.core.security.tokens.opaque_tokens import digest, generate_refresh_token
from app.domain.identity.models.enums import AccountStatus, VerificationPurpose
from app.domain.identity.models.refresh_session import RefreshSession
from app.domain.identity.models.user_account import UserAccount
from app.domain.identity.schemas.authentication import TokenPair
from app.domain.identity.services import (
    authorization_context_loader,
    email_eligibility,
    registration_service,
    verification_service,
)

# Consecutive failures before a temporary lockout, and how long that lockout lasts.
# 触发临时锁定的连续失败次数，以及锁定持续时长。
MAX_FAILED_ATTEMPTS = 8
LOCKOUT_MINUTES = 15

# Landing routes for accounts that can sign in but cannot yet use a department portal.
# 可以登录但尚不能进入部门门户的账号所对应的落地路由。
VERIFY_EMAIL_PATH = "/verify-email"
AWAITING_APPROVAL_PATH = "/awaiting-approval"
ACCOUNT_SUSPENDED_PATH = "/account-suspended"

# Verified against when no account matches, so a wrong address and a wrong password cost the same
# amount of time and cannot be told apart by an attacker probing for valid members.
# 账号不存在时用于对比的哈希，使「地址错误」与「密码错误」耗时相同，
# 攻击者无法据此探测哪些成员已注册。
_TIMING_EQUALIZER_HASH = hash_password("timing-equalizer-not-a-credential")


def resolve_landing_path(account: UserAccount) -> str:
    """Route the browser should open immediately after a successful sign-in."""
    if account.status is AccountStatus.PENDING_VERIFICATION:
        return VERIFY_EMAIL_PATH
    if account.status in {AccountStatus.SUSPENDED, AccountStatus.REJECTED}:
        return ACCOUNT_SUSPENDED_PATH

    primary = next(
        (
            membership
            for membership in account.memberships
            if membership.is_primary and membership.is_current
        ),
        None,
    )
    if primary is None:
        primary = next(
            (membership for membership in account.memberships if membership.is_current), None
        )
    if primary is None:
        return AWAITING_APPROVAL_PATH
    return primary.department.portal_path


async def sign_in(
    session: AsyncSession,
    *,
    email: str,
    password: str,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> tuple[UserAccount, TokenPair]:
    """Exchange credentials for a token pair, or refuse with a message the member can act on."""
    now = datetime.now(UTC)
    normalized = email_eligibility.normalize(email)

    statement = select(UserAccount).where(UserAccount.email == normalized)
    account = (await session.execute(statement)).scalar_one_or_none()

    if account is None:
        verify_password(password, _TIMING_EQUALIZER_HASH)
        raise _invalid_credentials()

    if account.locked_until is not None and account.locked_until > now:
        remaining = int((account.locked_until - now).total_seconds() // 60) + 1
        raise AuthenticationFailed(
            message_en=f"Too many failed attempts. Try again in {remaining} minute(s).",
            message_zh=f"失败次数过多，请在 {remaining} 分钟后重试。",
        )

    if not verify_password(password, account.password_hash):
        account.failed_login_count += 1
        if account.failed_login_count >= MAX_FAILED_ATTEMPTS:
            account.locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
            account.failed_login_count = 0
        await session.flush()
        raise _invalid_credentials()

    if account.status in {AccountStatus.SUSPENDED, AccountStatus.REJECTED}:
        raise AuthenticationFailed(
            message_en="This account is not active. Contact the Administration department.",
            message_zh="该账号已停用，请联系行政部。",
        )

    if needs_rehash(account.password_hash):
        account.password_hash = hash_password(password)

    account.failed_login_count = 0
    account.locked_until = None
    account.last_login_at = now
    await session.flush()

    # Reload with memberships eagerly attached so the landing path can be resolved without a
    # lazy load on an async session.
    # 重新加载并预取成员关系，使落地路径的计算无需在异步会话上触发延迟加载。
    loaded = await authorization_context_loader.load_account(session, account.id)
    account = loaded or account

    tokens = await _issue_session(
        session, account=account, user_agent=user_agent, ip_address=ip_address, now=now
    )
    return account, tokens


async def refresh(
    session: AsyncSession,
    *,
    refresh_token: str,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> tuple[UserAccount, TokenPair]:
    """Rotate a refresh token, revoking every session if a used token is replayed."""
    now = datetime.now(UTC)
    token_digest = digest(refresh_token)

    statement = select(RefreshSession).where(RefreshSession.token_digest == token_digest)
    stored = (await session.execute(statement)).scalar_one_or_none()

    if stored is None:
        raise AuthenticationFailed(
            message_en="Your session has ended. Sign in again.",
            message_zh="登录状态已失效，请重新登录。",
        )

    if not stored.is_active(now):
        await _revoke_all_sessions(session, stored.user_id, now)
        raise AuthenticationFailed(
            message_en="Your session has ended. Sign in again.",
            message_zh="登录状态已失效，请重新登录。",
        )

    account = await authorization_context_loader.load_account(session, stored.user_id)
    if account is None or account.status in {AccountStatus.SUSPENDED, AccountStatus.REJECTED}:
        await _revoke_all_sessions(session, stored.user_id, now)
        raise AuthenticationFailed(
            message_en="This account is not active. Contact the Administration department.",
            message_zh="该账号已停用，请联系行政部。",
        )

    tokens, replacement = await _create_refresh_session(
        session, account=account, user_agent=user_agent, ip_address=ip_address, now=now
    )
    stored.revoked_at = now
    stored.rotated_to_id = replacement.id
    await session.flush()
    return account, tokens


async def sign_out(
    session: AsyncSession,
    *,
    user_id: UUID,
    refresh_token: str | None,
    all_sessions: bool,
) -> None:
    now = datetime.now(UTC)
    if all_sessions or refresh_token is None:
        await _revoke_all_sessions(session, user_id, now)
        return

    await session.execute(
        update(RefreshSession)
        .where(
            RefreshSession.user_id == user_id,
            RefreshSession.token_digest == digest(refresh_token),
            RefreshSession.revoked_at.is_(None),
        )
        .values(revoked_at=now)
    )


async def change_password(
    session: AsyncSession,
    *,
    account: UserAccount,
    current_password: str,
    new_password: str,
) -> None:
    """Replace a password after proving the current one, then end every existing session."""
    if not verify_password(current_password, account.password_hash):
        raise AuthenticationFailed(
            message_en="The current password is incorrect.",
            message_zh="当前密码不正确。",
            details={"field": "current_password"},
        )
    _assert_password_acceptable(new_password)

    account.password_hash = hash_password(new_password)
    await session.flush()
    await _revoke_all_sessions(session, account.id, datetime.now(UTC))


async def reset_password(
    session: AsyncSession, *, email: str, submitted_code: str, new_password: str
) -> None:
    """Complete a code-based reset and invalidate any session opened with the old password."""
    normalized = email_eligibility.normalize(email)
    account = await registration_service.find_by_email(session, normalized)
    if account is None:
        raise ValidationFailed(
            message_en="This code has expired. Request a new one.",
            message_zh="验证码已失效，请重新获取。",
            details={"field": "code"},
        )

    await verification_service.redeem_code(
        session,
        email=normalized,
        purpose=VerificationPurpose.PASSWORD_RESET,
        submitted_code=submitted_code,
    )
    _assert_password_acceptable(new_password)

    account.password_hash = hash_password(new_password)
    account.failed_login_count = 0
    account.locked_until = None
    await session.flush()
    await _revoke_all_sessions(session, account.id, datetime.now(UTC))


def _assert_password_acceptable(candidate: str) -> None:
    violations = policy.evaluate(candidate)
    if violations:
        raise ValidationFailed(
            message_en=violations[0].message_en,
            message_zh=violations[0].message_zh,
            details={
                "field": "new_password",
                "violations": [violation.code for violation in violations],
            },
        )


def _invalid_credentials() -> AuthenticationFailed:
    return AuthenticationFailed(
        message_en="Incorrect email or password.",
        message_zh="邮箱或密码不正确。",
    )


async def _issue_session(
    session: AsyncSession,
    *,
    account: UserAccount,
    user_agent: str | None,
    ip_address: str | None,
    now: datetime,
) -> TokenPair:
    tokens, _ = await _create_refresh_session(
        session, account=account, user_agent=user_agent, ip_address=ip_address, now=now
    )
    return tokens


async def _create_refresh_session(
    session: AsyncSession,
    *,
    account: UserAccount,
    user_agent: str | None,
    ip_address: str | None,
    now: datetime,
) -> tuple[TokenPair, RefreshSession]:
    settings = get_settings()
    refresh_token = generate_refresh_token()
    record = RefreshSession(
        user_id=account.id,
        token_digest=digest(refresh_token),
        expires_at=now + timedelta(days=settings.refresh_token_ttl_days),
        user_agent=(user_agent or "")[:300] or None,
        ip_address=ip_address,
    )
    session.add(record)
    await session.flush()

    access_token, access_expires_at = issue_access_token(account.id, record.id)
    pair = TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_expires_at=access_expires_at,
        refresh_token_expires_at=record.expires_at,
        landing_path=resolve_landing_path(account),
    )
    return pair, record


async def _revoke_all_sessions(session: AsyncSession, user_id: UUID, now: datetime) -> None:
    await session.execute(
        update(RefreshSession)
        .where(RefreshSession.user_id == user_id, RefreshSession.revoked_at.is_(None))
        .values(revoked_at=now)
    )
