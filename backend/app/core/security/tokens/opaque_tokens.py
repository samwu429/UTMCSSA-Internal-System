"""Generation and constant-time verification of opaque secrets.

Covers two cases with the same primitive: refresh tokens handed to the browser and the numeric
codes emailed during registration. Both are stored only as SHA-256 digests, so the database never
holds a replayable value.

以同一套原语覆盖两种场景：下发给浏览器的刷新令牌，以及注册时发送到邮箱的数字验证码。
两者均仅以 SHA-256 摘要入库，数据库中不存在可直接重放的明文。
"""

from __future__ import annotations

import hashlib
import hmac
import secrets

REFRESH_TOKEN_BYTES = 32


def generate_refresh_token() -> str:
    """URL-safe random string with 256 bits of entropy."""
    return secrets.token_urlsafe(REFRESH_TOKEN_BYTES)


def generate_numeric_code(length: int) -> str:
    """Zero-padded decimal code drawn from a cryptographically secure source.

    Leading zeros are preserved so every issued code has the advertised length, which matters for
    the fixed-width input rendered in the verification form.

    保留前导零以保证验证码长度固定，前端定宽输入框依赖这一点。
    """
    if length < 4:
        raise ValueError("Verification codes must be at least four digits.")
    upper_bound = 10**length
    return str(secrets.randbelow(upper_bound)).zfill(length)


def digest(secret: str) -> str:
    """Hex SHA-256 digest used as the stored representation of a secret."""
    return hashlib.sha256(secret.encode("utf-8")).hexdigest()


def matches(secret: str, stored_digest: str) -> bool:
    """Constant-time comparison against a stored digest."""
    return hmac.compare_digest(digest(secret), stored_digest)
