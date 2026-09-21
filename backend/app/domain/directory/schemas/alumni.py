"""Alumni network payloads: the graduate-facing slice of the member directory."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AlumniSummary(BaseModel):
    """Card in the alumni browser.

    Contact channels appear only when the graduate opted into being reached, which keeps the
    network useful without turning the roster into a mailing list.

    仅在校友本人开启联络意愿时展示联系方式，既保留网络价值，又避免名录沦为群发邮件列表。
    """

    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    display_name: str
    chinese_name: str | None = None
    avatar_url: str | None = None
    graduation_year: int | None = None
    program_of_study: str | None = None
    degree: str | None = None
    current_employer: str | None = None
    current_role: str | None = None
    industry: str | None = None
    city: str | None = None
    country: str | None = None
    expertise_tags: list[str] = Field(default_factory=list)
    open_to_mentorship: bool = False
    open_to_referrals: bool = False
    message_to_students: str | None = None

    email: EmailStr | None = None
    linkedin_url: str | None = None
    personal_site_url: str | None = None


class AlumniPage(BaseModel):
    items: list[AlumniSummary]
    total: int
    page: int
    page_size: int


class AlumniProfileUpdate(BaseModel):
    """What a graduate maintains about themselves in the network."""

    degree: str | None = Field(default=None, max_length=160)
    current_employer: str | None = Field(default=None, max_length=160)
    current_role: str | None = Field(default=None, max_length=160)
    industry: str | None = Field(default=None, max_length=120)
    city: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    linkedin_url: str | None = Field(default=None, max_length=300)
    personal_site_url: str | None = Field(default=None, max_length=300)
    expertise_tags: list[str] | None = None
    open_to_mentorship: bool | None = None
    open_to_referrals: bool | None = None
    is_discoverable: bool | None = None
    message_to_students: str | None = Field(default=None, max_length=1000)
