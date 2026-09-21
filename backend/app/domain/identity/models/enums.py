"""Lifecycle vocabulary for accounts and email verification."""

from __future__ import annotations

from enum import StrEnum


class AccountStatus(StrEnum):
    """Where an account sits in the join-the-association flow.

    Registration deliberately ends in ``PENDING_APPROVAL`` rather than ``ACTIVE``: proving control
    of a University of Toronto mailbox establishes identity, not membership. A presidium member
    still decides which department the account belongs to.

    注册流程刻意止于 PENDING_APPROVAL 而非 ACTIVE：验证多大邮箱只能证明身份，不能证明社团成员资格，
    仍需主席团成员决定其部门归属。
    """

    PENDING_VERIFICATION = "pending_verification"
    PENDING_APPROVAL = "pending_approval"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REJECTED = "rejected"


class AffiliationType(StrEnum):
    """Whether the account holder is currently enrolled or has graduated."""

    STUDENT = "student"
    ALUMNUS = "alumnus"


class VerificationPurpose(StrEnum):
    """Why a one-time code was issued."""

    REGISTRATION = "registration"
    PASSWORD_RESET = "password_reset"
    EMAIL_CHANGE = "email_change"
