"""A member's self-reported course schedule, used to personalize the daily digest.

The association has no access to ROSI or ACORN, so members enter their own timetable. Each row is
one meeting pattern of one course, which is enough to answer "what do I have today".

社团无法接入 ROSI/ACORN，因此由成员自行录入课表。每行记录一门课的一种上课时间模式，
足以回答「我今天有什么课」。
"""

from __future__ import annotations

import uuid
from datetime import time

from sqlalchemy import Boolean, ForeignKey, Index, String, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.base import Base, JsonColumn, TimestampMixin, UuidPrimaryKeyMixin


class CourseEnrolment(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "course_enrolment"
    __table_args__ = (Index("ix_course_enrolment_user_term", "user_id", "term_code", "is_active"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user_account.id", ondelete="CASCADE"), nullable=False
    )

    course_code: Mapped[str] = mapped_column(String(24), nullable=False)
    course_title: Mapped[str | None] = mapped_column(String(200))
    section_code: Mapped[str | None] = mapped_column(String(24))
    # Registrar-style term identifier such as "2026F" or "2027W".
    # 教务风格的学期代码，例如 "2026F" 或 "2027W"。
    term_code: Mapped[str] = mapped_column(String(12), nullable=False)

    # ISO weekday numbers, Monday = 1 through Sunday = 7.
    # ISO 星期编号，周一为 1，周日为 7。
    meeting_weekdays: Mapped[list[int]] = mapped_column(JsonColumn, default=list, nullable=False)
    starts_at: Mapped[time | None] = mapped_column(Time)
    ends_at: Mapped[time | None] = mapped_column(Time)
    location: Mapped[str | None] = mapped_column(String(160))
    instructor: Mapped[str | None] = mapped_column(String(160))

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
