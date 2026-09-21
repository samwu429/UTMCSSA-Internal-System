"""Course timetable endpoints scoped to the signed-in member."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, status

from app.api.deps.authentication import ActiveAccountDependency, SessionDependency
from app.domain.academics.schemas.course import CourseEnrolmentInput, CourseEnrolmentRecord
from app.domain.academics.services import timetable_service

router = APIRouter(prefix="/courses/me", tags=["academics"])


@router.get("", response_model=list[CourseEnrolmentRecord])
async def list_own_courses(
    account: ActiveAccountDependency,
    session: SessionDependency,
    term_code: str | None = None,
) -> list[CourseEnrolmentRecord]:
    return await timetable_service.list_own(session, account.id, term_code=term_code)


@router.post("", response_model=CourseEnrolmentRecord, status_code=status.HTTP_201_CREATED)
async def add_course(
    payload: CourseEnrolmentInput,
    account: ActiveAccountDependency,
    session: SessionDependency,
) -> CourseEnrolmentRecord:
    return await timetable_service.add(session, account.id, payload)


@router.patch("/{enrolment_id}", response_model=CourseEnrolmentRecord)
async def update_course(
    enrolment_id: UUID,
    payload: CourseEnrolmentInput,
    account: ActiveAccountDependency,
    session: SessionDependency,
) -> CourseEnrolmentRecord:
    return await timetable_service.modify(session, account.id, enrolment_id, payload)


@router.delete("/{enrolment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    enrolment_id: UUID,
    account: ActiveAccountDependency,
    session: SessionDependency,
) -> None:
    await timetable_service.remove(session, account.id, enrolment_id)
