"""Outbound messaging endpoints: broadcasts, delivery history, and digest preview."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.deps.authentication import (
    ActiveAccountDependency,
    ContextDependency,
    SessionDependency,
)
from app.api.deps.services import DispatcherDependency
from app.core.errors.exceptions import PermissionDenied
from app.core.security.authorization.permissions.catalog import Permission
from app.domain.notifications.models.email_delivery_log import EmailDeliveryLog
from app.domain.notifications.schemas.messaging import (
    BroadcastRequest,
    BroadcastResult,
    DailyDigestContent,
    EmailDeliveryRecord,
)
from app.domain.notifications.services import broadcast_service, digest_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/broadcast", response_model=BroadcastResult)
async def send_broadcast(
    payload: BroadcastRequest,
    session: SessionDependency,
    context: ContextDependency,
    dispatcher: DispatcherDependency,
) -> BroadcastResult:
    return await broadcast_service.send_broadcast(session, context, payload, dispatcher)


@router.get("/deliveries", response_model=list[EmailDeliveryRecord])
async def list_deliveries(
    session: SessionDependency,
    context: ContextDependency,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=30, ge=1, le=100),
) -> list[EmailDeliveryRecord]:
    """Recent delivery attempts, restricted to operators who can send mail in the first place."""
    if not (
        context.has(Permission.NOTIFICATIONS_SEND_DEPARTMENT)
        or context.has(Permission.NOTIFICATIONS_SEND_ORGANIZATION)
    ):
        raise PermissionDenied(
            message_en="You cannot view email delivery history.",
            message_zh="你没有查看邮件发送记录的权限。",
        )

    from sqlalchemy import select

    rows = (
        (
            await session.execute(
                select(EmailDeliveryLog)
                .order_by(EmailDeliveryLog.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        .scalars()
        .all()
    )
    return [EmailDeliveryRecord.model_validate(row) for row in rows]


@router.post("/daily-digest/preview", response_model=DailyDigestContent)
async def preview_daily_digest(
    account: ActiveAccountDependency,
    session: SessionDependency,
) -> DailyDigestContent:
    """Render today's digest for the caller without sending anything."""
    from app.infrastructure.weather.open_meteo import fetch_daily_forecast

    target_date = digest_service.organization_today()
    weather = await fetch_daily_forecast(target_date)
    return await digest_service.build_content(
        session, account, target_date=target_date, weather=weather
    )
