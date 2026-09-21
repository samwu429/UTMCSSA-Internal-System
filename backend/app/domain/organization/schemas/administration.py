"""Payloads for the presidium's administration console.

Written for operators who are not engineers: a decision is expressed as "put this person in this
department with this permission set", and the response says in plain language what happened.

面向非工程背景的操作者：一次决策就是「把这个人放进这个部门，并赋予这套权限集合」，
响应以自然语言说明结果。
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.domain.audit.models.audit_log_entry import AuditAction
from app.domain.identity.models.enums import AccountStatus, AffiliationType


class PendingRegistration(BaseModel):
    """An account that proved its mailbox and is waiting for a placement decision."""

    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    email: EmailStr
    legal_name: str
    chinese_name: str | None = None
    preferred_name: str | None = None
    affiliation: AffiliationType
    graduation_year: int | None = None
    enrolment_year: int | None = None
    program_of_study: str | None = None
    phone_number: str | None = None
    requested_department_slug: str | None = None
    email_verified_at: datetime | None = None
    registered_at: datetime


class RegistrationApproval(BaseModel):
    """Accept an applicant and place them."""

    department_id: UUID
    role_id: UUID
    title_en: str | None = Field(default=None, max_length=120)
    title_zh: str | None = Field(default=None, max_length=120)
    term_label: str | None = Field(default=None, max_length=32)
    welcome_note: str | None = Field(default=None, max_length=1000)


class RegistrationRejection(BaseModel):
    """Decline an applicant, with a reason included in the notification email."""

    reason_zh: str = Field(min_length=1, max_length=1000)
    reason_en: str | None = Field(default=None, max_length=1000)


class AccountStatusChange(BaseModel):
    """Suspend or reactivate an account, for example when a member's term ends."""

    status: AccountStatus
    reason: str | None = Field(default=None, max_length=1000)


class AdministrationActionResult(BaseModel):
    """Plain-language confirmation rendered directly in the console."""

    user_id: UUID
    status: AccountStatus
    message_en: str
    message_zh: str


class AuditEntryView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    action: AuditAction
    actor_id: UUID | None = None
    actor_name: str | None = None
    target_type: str
    target_id: UUID | None = None
    department_id: UUID | None = None
    summary: str
    created_at: datetime


class AuditEntryPage(BaseModel):
    items: list[AuditEntryView]
    total: int
    page: int
    page_size: int


class OversightSnapshot(BaseModel):
    """Numbers the presidium dashboard opens with."""

    total_active_members: int
    total_alumni: int
    pending_registrations: int
    suspended_accounts: int
    departments: int
    documents: int
    upcoming_activities: int
