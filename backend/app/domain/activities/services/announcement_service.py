"""Announcement posting and the portal feed it produces."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors.exceptions import PermissionDenied
from app.core.security.authorization.evaluator import AuthorizationContext
from app.core.security.authorization.permissions.catalog import Permission
from app.domain.activities.models.activity import ActivityAudience
from app.domain.activities.models.announcement import Announcement
from app.domain.activities.schemas.activity import AnnouncementCreate, AnnouncementSummary
from app.domain.identity.models.user_account import UserAccount
from app.domain.notifications.models.email_delivery_log import EmailTemplateKey
from app.domain.notifications.schemas.messaging import BroadcastRequest
from app.domain.notifications.services import broadcast_service
from app.domain.organization.models.department import Department
from app.infrastructure.email.dispatcher import EmailDispatcher


async def list_announcements(
    session: AsyncSession,
    context: AuthorizationContext,
    *,
    department_id: UUID | None = None,
    limit: int = 20,
) -> list[AnnouncementSummary]:
    statement = (
        select(Announcement, Department.name_zh, UserAccount.legal_name)
        .outerjoin(Department, Department.id == Announcement.department_id)
        .outerjoin(UserAccount, UserAccount.id == Announcement.author_id)
        .where(Announcement.published_at.is_not(None))
    )

    if department_id is not None:
        statement = statement.where(
            or_(
                Announcement.department_id == department_id,
                Announcement.department_id.is_(None),
            )
        )
    elif not context.has_organization_reach:
        visible = context.department_ids
        statement = statement.where(
            or_(
                Announcement.department_id.is_(None),
                Announcement.department_id.in_(visible) if visible else False,
            )
        )

    rows = await session.execute(
        statement.order_by(
            Announcement.is_pinned.desc(), Announcement.published_at.desc()
        ).limit(limit)
    )

    return [
        AnnouncementSummary(
            id=announcement.id,
            title=announcement.title,
            body=announcement.body,
            department_id=announcement.department_id,
            department_name_zh=department_name,
            audience=announcement.audience,
            author_id=announcement.author_id,
            author_name=author_name,
            published_at=announcement.published_at,
            is_pinned=announcement.is_pinned,
            emailed_at=announcement.emailed_at,
        )
        for announcement, department_name, author_name in rows.all()
    ]


async def create_announcement(
    session: AsyncSession,
    context: AuthorizationContext,
    payload: AnnouncementCreate,
    dispatcher: EmailDispatcher,
) -> AnnouncementSummary:
    """Post an announcement, optionally mailing it to the same audience that can read it."""
    required = (
        Permission.NOTIFICATIONS_SEND_ORGANIZATION
        if payload.department_id is None
        else Permission.NOTIFICATIONS_SEND_DEPARTMENT
    )
    if not context.has(required, department_id=payload.department_id):
        raise PermissionDenied(
            message_en="You cannot post announcements to this audience.",
            message_zh="你没有面向该范围发布公告的权限。",
        )

    now = datetime.now(UTC)
    announcement = Announcement(
        title=payload.title,
        body=payload.body,
        department_id=payload.department_id,
        audience=payload.audience,
        author_id=context.user_id,
        is_pinned=payload.is_pinned,
        send_email=payload.send_email,
        published_at=now if payload.publish_now else None,
    )
    session.add(announcement)
    await session.flush()

    if payload.send_email and payload.publish_now:
        await broadcast_service.send_broadcast(
            session,
            context,
            BroadcastRequest(
                subject=payload.title,
                body=payload.body,
                department_id=payload.department_id,
                include_alumni=payload.audience is ActivityAudience.ALUMNI,
            ),
            dispatcher,
            template_key=EmailTemplateKey.DEPARTMENT_BROADCAST,
        )
        announcement.emailed_at = now
        await session.flush()

    department = (
        await session.get(Department, payload.department_id)
        if payload.department_id
        else None
    )
    return AnnouncementSummary(
        id=announcement.id,
        title=announcement.title,
        body=announcement.body,
        department_id=announcement.department_id,
        department_name_zh=department.name_zh if department else None,
        audience=announcement.audience,
        author_id=announcement.author_id,
        author_name=None,
        published_at=announcement.published_at,
        is_pinned=announcement.is_pinned,
        emailed_at=announcement.emailed_at,
    )
