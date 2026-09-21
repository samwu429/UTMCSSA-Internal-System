"""Issuing and redeeming the one-time codes sent to a member's mailbox.

Issuing a new code invalidates any outstanding one for the same address and purpose, so a member
who clicks resend three times is not left guessing which of three codes still works.

签发新验证码会作废同一地址与用途下的旧验证码，使连续点击三次重发的成员不必猜测哪一个仍然有效。
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config.settings import get_settings
from app.core.errors.exceptions import RateLimited, ValidationFailed
from app.core.security.tokens.opaque_tokens import digest, generate_numeric_code, matches
from app.domain.identity.models.email_verification_code import EmailVerificationCode
from app.domain.identity.models.enums import VerificationPurpose
from app.domain.identity.models.user_account import UserAccount

# Shortest gap between two code requests for the same address, which blunts mailbox flooding.
# 同一地址两次请求验证码的最短间隔，用于缓解邮箱轰炸。
RESEND_COOLDOWN_SECONDS = 60


async def issue_code(
    session: AsyncSession,
    *,
    email: str,
    purpose: VerificationPurpose,
    user: UserAccount | None = None,
) -> tuple[str, EmailVerificationCode]:
    """Create a fresh code, returning the plaintext for the email and the persisted record."""
    settings = get_settings()
    now = datetime.now(UTC)

    await _enforce_cooldown(session, email=email, purpose=purpose, now=now)
    await _invalidate_outstanding(session, email=email, purpose=purpose, now=now)

    plaintext = generate_numeric_code(settings.email_verification_code_length)
    record = EmailVerificationCode(
        user_id=user.id if user else None,
        email=email,
        purpose=purpose,
        code_digest=digest(plaintext),
        expires_at=now + timedelta(minutes=settings.email_verification_ttl_minutes),
    )
    session.add(record)
    await session.flush()
    return plaintext, record


async def redeem_code(
    session: AsyncSession,
    *,
    email: str,
    purpose: VerificationPurpose,
    submitted_code: str,
) -> EmailVerificationCode:
    """Consume a matching code, or explain why the submission was refused."""
    settings = get_settings()
    now = datetime.now(UTC)

    statement = (
        select(EmailVerificationCode)
        .where(
            EmailVerificationCode.email == email,
            EmailVerificationCode.purpose == purpose,
            EmailVerificationCode.consumed_at.is_(None),
        )
        .order_by(EmailVerificationCode.created_at.desc())
        .limit(1)
    )
    record = (await session.execute(statement)).scalar_one_or_none()

    if record is None or not record.is_usable(now, settings.email_verification_max_attempts):
        raise ValidationFailed(
            message_en="This code has expired. Request a new one.",
            message_zh="验证码已失效，请重新获取。",
            details={"field": "code"},
        )

    if not matches(submitted_code.strip(), record.code_digest):
        record.attempt_count += 1
        await session.flush()
        remaining = max(settings.email_verification_max_attempts - record.attempt_count, 0)
        raise ValidationFailed(
            message_en=f"Incorrect code. {remaining} attempt(s) remaining.",
            message_zh=f"验证码不正确，还可尝试 {remaining} 次。",
            details={"field": "code", "attempts_remaining": remaining},
        )

    record.consumed_at = now
    await session.flush()
    return record


async def _enforce_cooldown(
    session: AsyncSession, *, email: str, purpose: VerificationPurpose, now: datetime
) -> None:
    statement = (
        select(EmailVerificationCode.created_at)
        .where(
            EmailVerificationCode.email == email,
            EmailVerificationCode.purpose == purpose,
        )
        .order_by(EmailVerificationCode.created_at.desc())
        .limit(1)
    )
    last_issued = (await session.execute(statement)).scalar_one_or_none()
    if last_issued is None:
        return

    elapsed = (now - last_issued).total_seconds()
    if elapsed < RESEND_COOLDOWN_SECONDS:
        wait_seconds = int(RESEND_COOLDOWN_SECONDS - elapsed)
        raise RateLimited(
            message_en=f"Wait {wait_seconds} seconds before requesting another code.",
            message_zh=f"请在 {wait_seconds} 秒后再次获取验证码。",
            details={"retry_after_seconds": wait_seconds},
        )


async def _invalidate_outstanding(
    session: AsyncSession, *, email: str, purpose: VerificationPurpose, now: datetime
) -> None:
    await session.execute(
        update(EmailVerificationCode)
        .where(
            EmailVerificationCode.email == email,
            EmailVerificationCode.purpose == purpose,
            EmailVerificationCode.consumed_at.is_(None),
        )
        .values(consumed_at=now)
    )
