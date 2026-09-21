"""Member directory payloads, including the alumni view of the same roster."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.domain.identity.models.enums import AccountStatus, AffiliationType


class MemberDepartmentBadge(BaseModel):
    """Compact department label rendered next to a member's name."""

    model_config = ConfigDict(from_attributes=True)

    membership_id: UUID
    department_id: UUID
    slug: str
    name_zh: str
    name_en: str
    accent_color: str
    role_name_zh: str
    role_name_en: str
    title_zh: str | None = None
    title_en: str | None = None
    is_primary: bool


class MemberSummary(BaseModel):
    """Row in the member list.

    Contact fields are populated only for viewers holding the contact-details permission; for
    everyone else they are omitted entirely rather than masked, so the response never carries data
    the viewer is not entitled to.

    联系方式仅对持有相应权限的查看者填充；其余情况直接省略而非打码，
    使响应中不存在查看者无权获得的数据。
    """

    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    display_name: str
    legal_name: str
    chinese_name: str | None = None
    avatar_url: str | None = None
    status: AccountStatus
    affiliation: AffiliationType
    graduation_year: int | None = None
    program_of_study: str | None = None
    departments: list[MemberDepartmentBadge] = Field(default_factory=list)

    email: EmailStr | None = None
    phone_number: str | None = None
    wechat_id: str | None = None


class MemberDetail(MemberSummary):
    """Full profile page, adding biography and account timestamps."""

    biography: str | None = None
    campus: str | None = None
    enrolment_year: int | None = None
    pronouns: str | None = None
    created_at: datetime | None = None
    last_login_at: datetime | None = None


class MemberPage(BaseModel):
    """Paginated member list with the totals the roster header displays."""

    items: list[MemberSummary]
    total: int
    page: int
    page_size: int


class MemberProfileUpdate(BaseModel):
    """Fields a member may change about themselves; administrators reuse it for corrections."""

    preferred_name: str | None = Field(default=None, max_length=60)
    chinese_name: str | None = Field(default=None, max_length=60)
    pronouns: str | None = Field(default=None, max_length=40)
    phone_number: str | None = Field(default=None, max_length=32)
    wechat_id: str | None = Field(default=None, max_length=64)
    program_of_study: str | None = Field(default=None, max_length=160)
    graduation_year: int | None = Field(default=None, ge=1960, le=2100)
    enrolment_year: int | None = Field(default=None, ge=1960, le=2100)
    campus: str | None = Field(default=None, max_length=60)
    biography: str | None = Field(default=None, max_length=2000)
    avatar_url: str | None = Field(default=None, max_length=500)


class NotificationPreferenceUpdate(BaseModel):
    """Opt-in switches for the two recurring email streams."""

    receives_daily_digest: bool | None = None
    receives_activity_notices: bool | None = None
    preferred_language: str | None = Field(default=None, pattern="^(zh|en)$")
