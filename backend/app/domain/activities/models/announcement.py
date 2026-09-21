"""Announcements posted to a department portal or to the whole association.

Distinct from activities because an announcement has no schedule: it is a message with an audience.
Both feed the portal landing page, but only announcements can be pinned.

与活动分开建模：公告没有时间安排，只是「一条面向特定受众的消息」。两者都出现在门户首页，
但仅公告支持置顶。
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.activities.models.activity import ActivityAudience
from app.infrastructure.database.base import Base, TimestampMixin, UuidPrimaryKeyMixin


class Announcement(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "announcement"
    __table_args__ = (Index("ix_announcement_department_published", "department_id", "published_at"),)

    title: Mapped[str] = mapped_column(String(240), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)

    # Null targets the entire association rather than a single department.
    # 为空表示面向全社团，而非某个部门。
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("department.id", ondelete="CASCADE")
    )
    audience: Mapped[ActivityAudience] = mapped_column(
        Enum(ActivityAudience, name="activity_audience", native_enum=False, length=16),
        default=ActivityAudience.DEPARTMENT,
        nullable=False,
    )

    author_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("user_account.id", ondelete="SET NULL")
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    send_email: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    emailed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
