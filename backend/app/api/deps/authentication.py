"""Request dependencies that resolve the caller's identity and permissions.

Three levels are offered. ``require_account`` accepts anyone with a valid token, including members
still waiting for approval, so the verification and waiting screens can load their own state.
``require_active_account`` additionally demands an approved account, and is what every business
endpoint depends on.

提供三个层级。require_account 接受任何持有有效令牌的调用者（含待审批成员），
使验证页与等待页能够加载自身状态；require_active_account 额外要求账号已通过审批，
所有业务接口均依赖后者。
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors.exceptions import AuthenticationFailed, PermissionDenied
from app.core.security.authorization.evaluator import AuthorizationContext
from app.core.security.tokens.jwt_codec import TokenDecodeError, decode_access_token
from app.domain.identity.models.enums import AccountStatus
from app.domain.identity.models.refresh_session import RefreshSession
from app.domain.identity.models.user_account import UserAccount
from app.domain.identity.services import authorization_context_loader
from app.infrastructure.database.session import provide_session

_bearer_scheme = HTTPBearer(auto_error=False)

SessionDependency = Annotated[AsyncSession, Depends(provide_session)]


async def require_account(
    session: SessionDependency,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)
    ] = None,
) -> UserAccount:
    """Resolve the token holder, rejecting tokens whose session was revoked."""
    if credentials is None or not credentials.credentials:
        raise AuthenticationFailed(
            message_en="Sign in to continue.",
            message_zh="请先登录。",
        )

    try:
        claims = decode_access_token(credentials.credentials)
    except TokenDecodeError as error:
        raise AuthenticationFailed(
            message_en="Your session has ended. Sign in again.",
            message_zh="登录状态已失效，请重新登录。",
        ) from error

    # Signing out revokes the refresh session; checking it here stops an access token that has not
    # yet expired from outliving the sign-out that was supposed to end it.
    # 退出登录会吊销刷新会话；在此校验可避免尚未过期的访问令牌"活过"本应终止它的那次退出。
    stored_session = await session.get(RefreshSession, claims.session_id)
    if stored_session is None or stored_session.revoked_at is not None:
        raise AuthenticationFailed(
            message_en="Your session has ended. Sign in again.",
            message_zh="登录状态已失效，请重新登录。",
        )

    account = await authorization_context_loader.load_account(session, claims.user_id)
    if account is None:
        raise AuthenticationFailed(
            message_en="Your session has ended. Sign in again.",
            message_zh="登录状态已失效，请重新登录。",
        )
    if account.status in {AccountStatus.SUSPENDED, AccountStatus.REJECTED}:
        raise PermissionDenied(
            message_en="This account is not active. Contact the Administration department.",
            message_zh="该账号已停用，请联系行政部。",
        )
    return account


AccountDependency = Annotated[UserAccount, Depends(require_account)]


async def require_active_account(account: AccountDependency) -> UserAccount:
    """Reject accounts that have not been placed in a department yet."""
    if account.status is not AccountStatus.ACTIVE:
        raise PermissionDenied(
            message_en="Your account is still awaiting approval by the presidium.",
            message_zh="你的账号仍在等待主席团审批。",
            details={"status": account.status.value},
        )
    return account


ActiveAccountDependency = Annotated[UserAccount, Depends(require_active_account)]


async def require_context(account: ActiveAccountDependency) -> AuthorizationContext:
    """Authorization snapshot for the current request."""
    return authorization_context_loader.build_context(account)


ContextDependency = Annotated[AuthorizationContext, Depends(require_context)]


def client_address(request: Request) -> str | None:
    """Caller address, preferring the proxy header a deployment behind a load balancer sets."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()[:64]
    return request.client.host[:64] if request.client else None
