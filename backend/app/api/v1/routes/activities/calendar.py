"""Activity calendar and announcement endpoints."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Query, status

from app.api.deps.authentication import ContextDependency, SessionDependency
from app.api.deps.services import DispatcherDependency
from app.domain.activities.models.activity import ActivityStatus
from app.domain.activities.schemas.activity import (
    ActivityCreate,
    ActivityDetail,
    ActivityPublishRequest,
    ActivitySummary,
    ActivityUpdate,
    AnnouncementCreate,
    AnnouncementSummary,
)
from app.domain.activities.services import activity_service, announcement_service

router = APIRouter(tags=["activities"])


@router.get("/activities", response_model=list[ActivitySummary])
async def list_activities(
    session: SessionDependency,
    context: ContextDependency,
    department_id: UUID | None = None,
    starts_after: datetime | None = None,
    starts_before: datetime | None = None,
    activity_status: ActivityStatus | None = Query(default=None, alias="status"),
) -> list[ActivitySummary]:
    return await activity_service.list_activities(
        session,
        context,
        department_id=department_id,
        starts_after=starts_after,
        starts_before=starts_before,
        status=activity_status,
    )


@router.post("/activities", response_model=ActivityDetail, status_code=status.HTTP_201_CREATED)
async def create_activity(
    payload: ActivityCreate,
    session: SessionDependency,
    context: ContextDependency,
) -> ActivityDetail:
    return await activity_service.create_activity(session, context, payload)


@router.get("/activities/{activity_id}", response_model=ActivityDetail)
async def read_activity(
    activity_id: UUID,
    session: SessionDependency,
    context: ContextDependency,
) -> ActivityDetail:
    return await activity_service.get_activity(session, context, activity_id)


@router.patch("/activities/{activity_id}", response_model=ActivityDetail)
async def update_activity(
    activity_id: UUID,
    payload: ActivityUpdate,
    session: SessionDependency,
    context: ContextDependency,
) -> ActivityDetail:
    return await activity_service.update_activity(session, context, activity_id, payload)


@router.post("/activities/{activity_id}/publish", response_model=ActivityDetail)
async def publish_activity(
    activity_id: UUID,
    payload: ActivityPublishRequest,
    session: SessionDependency,
    context: ContextDependency,
    dispatcher: DispatcherDependency,
) -> ActivityDetail:
    return await activity_service.publish_activity(
        session,
        context,
        activity_id=activity_id,
        notify_by_email=payload.notify_by_email,
        dispatcher=dispatcher,
    )


@router.delete("/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(
    activity_id: UUID,
    session: SessionDependency,
    context: ContextDependency,
) -> None:
    await activity_service.delete_activity(session, context, activity_id)


@router.get("/announcements", response_model=list[AnnouncementSummary])
async def list_announcements(
    session: SessionDependency,
    context: ContextDependency,
    department_id: UUID | None = None,
    limit: int = Query(default=20, ge=1, le=50),
) -> list[AnnouncementSummary]:
    return await announcement_service.list_announcements(
        session, context, department_id=department_id, limit=limit
    )


@router.post(
    "/announcements", response_model=AnnouncementSummary, status_code=status.HTTP_201_CREATED
)
async def create_announcement(
    payload: AnnouncementCreate,
    session: SessionDependency,
    context: ContextDependency,
    dispatcher: DispatcherDependency,
) -> AnnouncementSummary:
    return await announcement_service.create_announcement(
        session, context, payload, dispatcher
    )
