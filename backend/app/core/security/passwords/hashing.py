"""Password hashing backed by Argon2id.

Verification reports whether the stored hash used outdated parameters so the caller can transparently
re-hash on a successful sign-in, keeping the corpus current as cost parameters are raised over time.

基于 Argon2id 的口令哈希。校验时会返回存量哈希是否使用了过时参数，调用方可在登录成功后透明重算，
从而在成本参数提升后逐步刷新历史数据。
"""

from __future__ import annotations

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

# Cost parameters follow the OWASP Argon2id baseline: 19 MiB memory, two iterations.
# 成本参数采用 OWASP Argon2id 基线：19 MiB 内存、两轮迭代。
_hasher = PasswordHasher(time_cost=2, memory_cost=19456, parallelism=1)


def hash_password(plaintext: str) -> str:
    return _hasher.hash(plaintext)


def verify_password(plaintext: str, stored_hash: str) -> bool:
    try:
        return _hasher.verify(stored_hash, plaintext)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def needs_rehash(stored_hash: str) -> bool:
    try:
        return _hasher.check_needs_rehash(stored_hash)
    except InvalidHashError:
        return True
