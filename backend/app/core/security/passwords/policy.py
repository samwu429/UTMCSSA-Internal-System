"""Minimum password requirements enforced at registration and password change.

The rules stay deliberately simple: length carries most of the strength, and complexity classes are
checked only to block the obvious "Password1" shape. Feedback is bilingual because it surfaces
directly in the sign-up form.

注册与改密时的最低口令要求。规则刻意从简：强度主要来自长度，复杂度检查仅用于拦截明显弱口令。
错误提示为中英双语，因为会直接展示在注册表单中。
"""

from __future__ import annotations

from dataclasses import dataclass

MINIMUM_LENGTH = 10
MAXIMUM_LENGTH = 128

# Rejected outright regardless of length, since they appear in every credential-stuffing list.
# 无论长度如何都直接拒绝，这些口令出现在所有撞库字典中。
_BANNED_PASSWORDS = frozenset(
    {
        "password",
        "password1",
        "password123",
        "12345678",
        "123456789",
        "1234567890",
        "qwertyuiop",
        "utmcssa",
        "utmcssa123",
        "utoronto",
        "utoronto123",
    }
)


@dataclass(frozen=True, slots=True)
class PasswordPolicyViolation:
    """A single reason a candidate password was rejected."""

    code: str
    message_en: str
    message_zh: str


def evaluate(candidate: str) -> list[PasswordPolicyViolation]:
    """Return every rule the candidate breaks; an empty list means the password is acceptable."""
    violations: list[PasswordPolicyViolation] = []

    if len(candidate) < MINIMUM_LENGTH:
        violations.append(
            PasswordPolicyViolation(
                code="too_short",
                message_en=f"Password must be at least {MINIMUM_LENGTH} characters.",
                message_zh=f"密码至少需要 {MINIMUM_LENGTH} 个字符。",
            )
        )
    if len(candidate) > MAXIMUM_LENGTH:
        violations.append(
            PasswordPolicyViolation(
                code="too_long",
                message_en=f"Password must be at most {MAXIMUM_LENGTH} characters.",
                message_zh=f"密码最多 {MAXIMUM_LENGTH} 个字符。",
            )
        )
    if candidate.lower() in _BANNED_PASSWORDS:
        violations.append(
            PasswordPolicyViolation(
                code="too_common",
                message_en="This password is too common. Choose something unique to you.",
                message_zh="该密码过于常见，请换一个只有你会想到的密码。",
            )
        )

    classes_present = sum(
        (
            any(character.islower() for character in candidate),
            any(character.isupper() for character in candidate),
            any(character.isdigit() for character in candidate),
            any(not character.isalnum() for character in candidate),
        )
    )
    if classes_present < 2:
        violations.append(
            PasswordPolicyViolation(
                code="insufficient_variety",
                message_en="Mix at least two of: lowercase, uppercase, digits, symbols.",
                message_zh="请至少混合两类字符：小写字母、大写字母、数字、符号。",
            )
        )

    return violations
