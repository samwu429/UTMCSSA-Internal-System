"""Course timetable payloads feeding the personalized daily digest."""

from __future__ import annotations

from datetime import time
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CourseEnrolmentInput(BaseModel):
    course_code: str = Field(min_length=2, max_length=24)
    course_title: str | None = Field(default=None, max_length=200)
    section_code: str | None = Field(default=None, max_length=24)
    term_code: str = Field(min_length=2, max_length=12)
    meeting_weekdays: list[int] = Field(default_factory=list)
    starts_at: time | None = None
    ends_at: time | None = None
    location: str | None = Field(default=None, max_length=160)
    instructor: str | None = Field(default=None, max_length=160)

    @field_validator("meeting_weekdays")
    @classmethod
    def _validate_weekdays(cls, value: list[int]) -> list[int]:
        if any(day < 1 or day > 7 for day in value):
            raise ValueError("Weekdays use ISO numbering: 1 is Monday and 7 is Sunday.")
        return sorted(set(value))


class CourseEnrolmentRecord(CourseEnrolmentInput):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_active: bool


class CourseScheduleEntry(BaseModel):
    """One class occurring on the digest's date, already sorted by start time."""

    course_code: str
    course_title: str | None = None
    section_code: str | None = None
    starts_at: time | None = None
    ends_at: time | None = None
    location: str | None = None
