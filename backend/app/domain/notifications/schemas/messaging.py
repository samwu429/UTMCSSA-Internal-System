"""Outbound messaging payloads: manual broadcasts and the daily digest."""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.academics.schemas.course import CourseScheduleEntry
from app.domain.notifications.models.email_delivery_log import (
    EmailDeliveryStatus,
    EmailTemplateKey,
)


class BroadcastRequest(BaseModel):
    """A message the presidium or a department lead sends to a roster.

    Leaving ``department_id`` empty targets the whole association and therefore demands the
    organization-wide send permission rather than the department one.

    department_id 为空表示面向全社团，因而要求组织级发送权限而非部门级权限。
    """

    subject: str = Field(min_length=1, max_length=240)
    body: str = Field(min_length=1, max_length=20000)
    department_id: UUID | None = None
    include_alumni: bool = False
    # Preview resolves the recipient list and returns it without sending anything.
    # 预览模式仅解析收件人列表并返回，不实际发送。
    preview_only: bool = False


class BroadcastResult(BaseModel):
    recipient_count: int
    sent_count: int
    skipped_count: int
    failed_count: int
    preview_recipients: list[str] = Field(default_factory=list)


class DailyDigestWeather(BaseModel):
    """Forecast block of the digest, expressed in the units the campus actually uses."""

    condition_en: str
    condition_zh: str
    temperature_high_celsius: float | None = None
    temperature_low_celsius: float | None = None
    precipitation_probability_percent: int | None = None
    sunrise: str | None = None
    sunset: str | None = None


class DailyDigestActivity(BaseModel):
    title: str
    department_name_zh: str | None = None
    starts_at: datetime
    location: str | None = None


class DailyDigestContent(BaseModel):
    """Everything assembled for one member on one day."""

    model_config = ConfigDict(from_attributes=True)

    digest_date: date
    weekday_en: str
    weekday_zh: str
    recipient_name: str
    weather: DailyDigestWeather | None = None
    courses: list[CourseScheduleEntry] = Field(default_factory=list)
    activities: list[DailyDigestActivity] = Field(default_factory=list)
    announcements: list[str] = Field(default_factory=list)


class EmailDeliveryRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    recipient_email: str
    template_key: EmailTemplateKey
    subject: str
    status: EmailDeliveryStatus
    failure_reason: str | None = None
    sent_at: datetime | None = None
    created_at: datetime
