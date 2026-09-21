"""Association activities: the calendar that feeds both portals and the daily digest.

An activity belongs to the department running it, but publication decides who hears about it.
Draft rows are visible only inside the owning department, which lets a team iterate on a plan
before the rest of the association sees it.

社团活动，既驱动各部门门户的日历，也作为每日摘要的内容来源。活动归属承办部门，
但「是否发布」决定其触达范围；草稿仅在承办部门内可见，便于团队在对外公开前反复打磨方案。
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.base import Base, TimestampMixin, UuidPrimaryKeyMixin


class ActivityStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class ActivityAudience(StrEnum):
    """Who the activity is announced to once published."""

    DEPARTMENT = "department"
    ALL_MEMBERS = "all_members"
    ALUMNI = "alumni"
    PUBLIC = "public"


class Activity(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "activity"
    __table_args__ = (Index("ix_activity_schedule", "status", "starts_at"),)

    title: Mapped[str] = mapped_column(String(240), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(String(240))

    department_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("department.id", ondelete="CASCADE"), nullable=False
    )

    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    status: Mapped[ActivityStatus] = mapped_column(
        Enum(ActivityStatus, name="activity_status", native_enum=False, length=16),
        default=ActivityStatus.DRAFT,
        nullable=False,
    )
    audience: Mapped[ActivityAudience] = mapped_column(
        Enum(ActivityAudience, name="activity_audience", native_enum=False, length=16),
        default=ActivityAudience.DEPARTMENT,
        nullable=False,
    )

    capacity: Mapped[int | None] = mapped_column(Integer)
    registration_url: Mapped[str | None] = mapped_column(String(500))
    cover_image_url: Mapped[str | None] = mapped_column(String(500))

    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("user_account.id", ondelete="SET NULL")
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Set once the announcement email has gone out, so republishing an edited activity does not
    # send a duplicate notice.
    # 公告邮件发出后写入，避免编辑后重新发布导致成员收到重复通知。
    announced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
