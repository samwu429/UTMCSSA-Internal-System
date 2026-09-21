"""Activity calendar and announcement payloads."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.activities.models.activity import ActivityAudience, ActivityStatus


class ActivitySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    summary: str | None = None
    location: str | None = None
    department_id: UUID
    department_slug: str | None = None
    department_name_zh: str | None = None
    department_accent_color: str | None = None
    starts_at: datetime
    ends_at: datetime | None = None
    status: ActivityStatus
    audience: ActivityAudience
    cover_image_url: str | None = None


class ActivityDetail(ActivitySummary):
    description: str | None = None
    capacity: int | None = None
    registration_url: str | None = None
    created_by_id: UUID | None = None
    created_by_name: str | None = None
    published_at: datetime | None = None
    announced_at: datetime | None = None


class ActivityCreate(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    summary: str | None = Field(default=None, max_length=500)
    description: str | None = Field(default=None, max_length=8000)
    location: str | None = Field(default=None, max_length=240)
    department_id: UUID
    starts_at: datetime
    ends_at: datetime | None = None
    audience: ActivityAudience = ActivityAudience.DEPARTMENT
    capacity: int | None = Field(default=None, ge=1)
    registration_url: str | None = Field(default=None, max_length=500)
    cover_image_url: str | None = Field(default=None, max_length=500)


class ActivityUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    summary: str | None = Field(default=None, max_length=500)
    description: str | None = Field(default=None, max_length=8000)
    location: str | None = Field(default=None, max_length=240)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    audience: ActivityAudience | None = None
    status: ActivityStatus | None = None
    capacity: int | None = Field(default=None, ge=1)
    registration_url: str | None = Field(default=None, max_length=500)
    cover_image_url: str | None = Field(default=None, max_length=500)


class ActivityPublishRequest(BaseModel):
    """Publishing is separated from editing because it is what triggers member emails."""

    notify_by_email: bool = True


class AnnouncementSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    body: str
    department_id: UUID | None = None
    department_name_zh: str | None = None
    audience: ActivityAudience
    author_id: UUID | None = None
    author_name: str | None = None
    published_at: datetime | None = None
    is_pinned: bool
    emailed_at: datetime | None = None


class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    body: str = Field(min_length=1, max_length=20000)
    department_id: UUID | None = None
    audience: ActivityAudience = ActivityAudience.DEPARTMENT
    is_pinned: bool = False
    send_email: bool = False
    publish_now: bool = True
