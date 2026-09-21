"""A member's own course timetable.

Every operation is bound to the signed-in account. There is no permission that lets one member
read another's schedule, because nothing in the association's work requires it.

所有操作均绑定当前登录账号。系统不存在「查看他人课表」的权限——社团业务中没有任何环节需要它。
"""

from __future__ import annotations

from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors.exceptions import ResourceNotFound
from app.domain.academics.models.course_enrolment import CourseEnrolment
from app.domain.academics.schemas.course import (
    CourseEnrolmentInput,
    CourseEnrolmentRecord,
    CourseScheduleEntry,
)


def _to_record(enrolment: CourseEnrolment) -> CourseEnrolmentRecord:
    return CourseEnrolmentRecord(
        id=enrolment.id,
        course_code=enrolment.course_code,
        course_title=enrolment.course_title,
        section_code=enrolment.section_code,
        term_code=enrolment.term_code,
        meeting_weekdays=list(enrolment.meeting_weekdays or []),
        starts_at=enrolment.starts_at,
        ends_at=enrolment.ends_at,
        location=enrolment.location,
        instructor=enrolment.instructor,
        is_active=enrolment.is_active,
    )


async def list_own(
    session: AsyncSession, user_id: UUID, *, term_code: str | None = None
) -> list[CourseEnrolmentRecord]:
    statement = select(CourseEnrolment).where(CourseEnrolment.user_id == user_id)
    if term_code:
        statement = statement.where(CourseEnrolment.term_code == term_code)

    rows = (
        (
            await session.execute(
                statement.order_by(
                    CourseEnrolment.term_code.desc(), CourseEnrolment.course_code.asc()
                )
            )
        )
        .scalars()
        .all()
    )
    return [_to_record(row) for row in rows]


async def add(
    session: AsyncSession, user_id: UUID, payload: CourseEnrolmentInput
) -> CourseEnrolmentRecord:
    enrolment = CourseEnrolment(user_id=user_id, **payload.model_dump())
    session.add(enrolment)
    await session.flush()
    return _to_record(enrolment)


async def modify(
    session: AsyncSession, user_id: UUID, enrolment_id: UUID, payload: CourseEnrolmentInput
) -> CourseEnrolmentRecord:
    enrolment = await _require_own(session, user_id, enrolment_id)
    for field_name, value in payload.model_dump(exclude_unset=True).items():
        setattr(enrolment, field_name, value)
    await session.flush()
    return _to_record(enrolment)


async def remove(session: AsyncSession, user_id: UUID, enrolment_id: UUID) -> None:
    enrolment = await _require_own(session, user_id, enrolment_id)
    await session.delete(enrolment)
    await session.flush()


async def classes_on(
    session: AsyncSession, user_id: UUID, target_date: date
) -> list[CourseScheduleEntry]:
    """Classes meeting on ``target_date``, ordered by start time for the digest."""
    weekday = target_date.isoweekday()
    statement = select(CourseEnrolment).where(
        CourseEnrolment.user_id == user_id,
        CourseEnrolment.is_active.is_(True),
    )
    rows = (await session.execute(statement)).scalars().all()

    scheduled = [
        CourseScheduleEntry(
            course_code=row.course_code,
            course_title=row.course_title,
            section_code=row.section_code,
            starts_at=row.starts_at,
            ends_at=row.ends_at,
            location=row.location,
        )
        for row in rows
        if weekday in (row.meeting_weekdays or [])
    ]
    scheduled.sort(key=lambda entry: (entry.starts_at is None, entry.starts_at))
    return scheduled


async def _require_own(
    session: AsyncSession, user_id: UUID, enrolment_id: UUID
) -> CourseEnrolment:
    statement = select(CourseEnrolment).where(
        CourseEnrolment.id == enrolment_id, CourseEnrolment.user_id == user_id
    )
    enrolment = (await session.execute(statement)).scalar_one_or_none()
    if enrolment is None:
        raise ResourceNotFound(
            message_en="That course entry could not be found.",
            message_zh="未找到该课程记录。",
        )
    return enrolment
