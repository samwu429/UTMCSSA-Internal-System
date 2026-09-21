"""Alumni network endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Query

from app.api.deps.authentication import (
    ActiveAccountDependency,
    ContextDependency,
    SessionDependency,
)
from app.domain.directory.schemas.alumni import (
    AlumniPage,
    AlumniProfileUpdate,
    AlumniSummary,
)
from app.domain.directory.services import alumni_service

router = APIRouter(prefix="/alumni", tags=["alumni"])


@router.get("", response_model=AlumniPage)
async def list_alumni(
    session: SessionDependency,
    context: ContextDependency,
    search: str | None = None,
    graduation_year: int | None = None,
    industry: str | None = None,
    city: str | None = None,
    open_to_mentorship: bool | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=60),
) -> AlumniPage:
    return await alumni_service.list_alumni(
        session,
        context,
        search=search,
        graduation_year=graduation_year,
        industry=industry,
        city=city,
        open_to_mentorship=open_to_mentorship,
        page=page,
        page_size=page_size,
    )


@router.put("/me", response_model=AlumniSummary)
async def update_own_alumni_profile(
    payload: AlumniProfileUpdate,
    account: ActiveAccountDependency,
    session: SessionDependency,
) -> AlumniSummary:
    return await alumni_service.upsert_own_profile(session, account, payload)


@router.get("/{user_id}", response_model=AlumniSummary)
async def read_alumnus(
    user_id: UUID,
    session: SessionDependency,
    context: ContextDependency,
) -> AlumniSummary:
    return await alumni_service.get_alumnus(session, context, user_id)
