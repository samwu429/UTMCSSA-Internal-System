"""Issuing and decoding of the short-lived access token.

Only the access token is a JWT. Refresh tokens are opaque random strings stored as hashes, so a
stolen database row cannot be replayed and a session can be revoked server-side at any moment.

仅访问令牌使用 JWT；刷新令牌为不透明随机串并以哈希形式入库，因此数据库泄露无法被直接重放，
且服务端可随时吊销会话。
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from jwt.exceptions import InvalidTokenError

from app.core.config.settings import get_settings

ACCESS_TOKEN_TYPE = "access"


class TokenDecodeError(Exception):
    """Raised when a presented token is malformed, expired, or not an access token."""


@dataclass(frozen=True, slots=True)
class AccessTokenClaims:
    """Claims carried by an access token.

    The token intentionally holds no permission list: permissions are re-read from the database on
    every request so that a revoked role takes effect immediately rather than at token expiry.

    令牌刻意不携带权限列表；权限在每次请求时从数据库重新读取，使权限回收立即生效而非等待令牌过期。
    """

    user_id: UUID
    session_id: UUID
    issued_at: datetime
    expires_at: datetime


def issue_access_token(user_id: UUID, session_id: UUID) -> tuple[str, datetime]:
    """Return a signed access token and the moment it stops being valid."""
    settings = get_settings()
    issued_at = datetime.now(UTC)
    expires_at = issued_at + timedelta(minutes=settings.access_token_ttl_minutes)
    payload = {
        "sub": str(user_id),
        "sid": str(session_id),
        "typ": ACCESS_TOKEN_TYPE,
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, expires_at


def decode_access_token(token: str) -> AccessTokenClaims:
    """Validate signature and expiry, then project the payload into typed claims."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["sub", "sid", "exp", "iat"]},
        )
    except InvalidTokenError as error:
        raise TokenDecodeError(str(error)) from error

    if payload.get("typ") != ACCESS_TOKEN_TYPE:
        raise TokenDecodeError("Token is not an access token.")

    try:
        return AccessTokenClaims(
            user_id=UUID(payload["sub"]),
            session_id=UUID(payload["sid"]),
            issued_at=datetime.fromtimestamp(payload["iat"], tz=UTC),
            expires_at=datetime.fromtimestamp(payload["exp"], tz=UTC),
        )
    except (KeyError, ValueError) as error:
        raise TokenDecodeError("Token claims are malformed.") from error
