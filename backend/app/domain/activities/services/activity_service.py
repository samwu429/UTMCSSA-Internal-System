"""Activity calendar operations and the announcement email triggered by publishing."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import Select, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config.settings import get_settings
from app.core.errors.exceptions import PermissionDenied, ResourceNotFound
from app.core.security.authorization.evaluator import AuthorizationContext
from app.core.security.authorization.permissions.catalog import Permission
from app.domain.activities.models.activity import Activity, ActivityAudience, ActivityStatus
from app.domain.activities.schemas.activity import (
    ActivityCreate,
    ActivityDetail,
    ActivitySummary,
    ActivityUpdate,
)
from app.domain.identity.models.enums import AccountStatus, AffiliationType
from app.domain.identity.models.user_account import UserAccount
from app.domain.notifications.models.email_delivery_log import EmailTemplateKey
from app.domain.organization.models.department import Department
from app.infrastructure.email.dispatcher import EmailDispatcher
from app.infrastructure.email.templates import activity_notice


def _visible_filter(statement: Select, context: AuthorizationContext) -> Select:
    """Drafts stay inside the owning department; published activities follow their audience."""
    if not context.has(Permission.EVENTS_VIEW):
        raise PermissionDenied(
            message_en="You do not have access to the activity calendar.",
            message_zh="你没有查看活动日历的权限。",
        )
    if context.has_organization_reach:
        return statement

    own_departments = context.department_ids
    conditions = [
        Activity.status.in_([ActivityStatus.PUBLISHED, ActivityStatus.COMPLETED])
        & Activity.audience.in_([ActivityAudience.ALL_MEMBERS, ActivityAudience.PUBLIC])
    ]
    if own_departments:
        conditions.append(Activity.department_id.in_(own_departments))
    return statement.where(or_(*conditions))


def _to_summary(activity: Activity, department: Department | None) -> ActivitySummary:
    return ActivitySummary(
        id=activity.id,
        title=activity.title,
        summary=activity.summary,
        location=activity.location,
        department_id=activity.department_id,
        department_slug=department.slug if department else None,
        department_name_zh=department.name_zh if department else None,
        department_accent_color=department.accent_color if department else None,
        starts_at=activity.starts_at,
        ends_at=activity.ends_at,
        status=activity.status,
        audience=activity.audience,
        cover_image_url=activity.cover_image_url,
    )


def _to_detail(activity: Activity, department: Department | None) -> ActivityDetail:
    return ActivityDetail(
        **_to_summary(activity, department).model_dump(),
        description=activity.description,
        capacity=activity.capacity,
        registration_url=activity.registration_url,
        created_by_id=activity.created_by_id,
        published_at=activity.published_at,
        announced_at=activity.announced_at,
    )


async def list_activities(
    session: AsyncSession,
    context: AuthorizationContext,
    *,
    department_id: UUID | None = None,
    starts_after: datetime | None = None,
    starts_before: datetime | None = None,
    status: ActivityStatus | None = None,
) -> list[ActivitySummary]:
    statement = _visible_filter(select(Activity), context)
    if department_id is not None:
        statement = statement.where(Activity.department_id == department_id)
    if starts_after is not None:
        statement = statement.where(Activity.starts_at >= starts_after)
    if starts_before is not None:
        statement = statement.where(Activity.starts_at <= starts_before)
    if status is not None:
        statement = statement.where(Activity.status == status)

    rows = (
        (await session.execute(statement.order_by(Activity.starts_at.asc())))
        .unique()
        .scalars()
        .all()
    )
    departments = await _load_departments(session, {row.department_id for row in rows})
    return [_to_summary(row, departments.get(row.department_id)) for row in rows]


async def get_activity(
    session: AsyncSession, context: AuthorizationContext, activity_id: UUID
) -> ActivityDetail:
    activity = await _require_visible(session, context, activity_id)
    department = await session.get(Department, activity.department_id)
    return _to_detail(activity, department)


async def create_activity(
    session: AsyncSession, context: AuthorizationContext, payload: ActivityCreate
) -> ActivityDetail:
    if not context.has(Permission.EVENTS_CREATE, department_id=payload.department_id):
        raise PermissionDenied(
            message_en="You cannot create activities for this department.",
            message_zh="你没有为该部门创建活动的权限。",
        )

    department = await session.get(Department, payload.department_id)
    if department is None:
        raise ResourceNotFound(
            message_en="That department could not be found.",
            message_zh="未找到该部门。",
        )

    activity = Activity(
        **payload.model_dump(),
        status=ActivityStatus.DRAFT,
        created_by_id=context.user_id,
    )
    session.add(activity)
    await session.flush()
    return _to_detail(activity, department)


async def update_activity(
    session: AsyncSession,
    context: AuthorizationContext,
    activity_id: UUID,
    payload: ActivityUpdate,
) -> ActivityDetail:
    activity = await _require_visible(session, context, activity_id)
    if not context.has(Permission.EVENTS_EDIT, department_id=activity.department_id):
        raise PermissionDenied(
            message_en="You cannot edit this activity.",
            message_zh="你没有修改该活动的权限。",
        )

    for field_name, value in payload.model_dump(exclude_unset=True).items():
        setattr(activity, field_name, value)
    await session.flush()

    department = await session.get(Department, activity.department_id)
    return _to_detail(activity, department)


async def publish_activity(
    session: AsyncSession,
    context: AuthorizationContext,
    *,
    activity_id: UUID,
    notify_by_email: bool,
    dispatcher: EmailDispatcher,
) -> ActivityDetail:
    """Make an activity visible to its audience and, once only, email that audience."""
    activity = await _require_visible(session, context, activity_id)
    if not context.has(Permission.EVENTS_PUBLISH, department_id=activity.department_id):
        raise PermissionDenied(
            message_en="You cannot publish activities.",
            message_zh="你没有发布活动的权限。",
        )

    department = await session.get(Department, activity.department_id)
    if department is None:
        raise ResourceNotFound(
            message_en="That department could not be found.",
            message_zh="未找到该部门。",
        )

    now = datetime.now(UTC)
    activity.status = ActivityStatus.PUBLISHED
    if activity.published_at is None:
        activity.published_at = now
    await session.flush()

    if notify_by_email and activity.announced_at is None:
        await _announce(session, dispatcher, activity=activity, department=department)
        activity.announced_at = now
        await session.flush()

    return _to_detail(activity, department)


async def delete_activity(
    session: AsyncSession, context: AuthorizationContext, activity_id: UUID
) -> None:
    activity = await _require_visible(session, context, activity_id)
    if not context.has(Permission.EVENTS_DELETE, department_id=activity.department_id):
        raise PermissionDenied(
            message_en="You cannot delete activities.",
            message_zh="你没有删除活动的权限。",
        )
    await session.delete(activity)
    await session.flush()


async def _announce(
    session: AsyncSession,
    dispatcher: EmailDispatcher,
    *,
    activity: Activity,
    department: Department,
) -> None:
    settings = get_settings()
    recipients = await _resolve_audience(session, activity)
    subject, html_body, text_body = activity_notice.activity_announcement(
        title=activity.title,
        department_name_zh=department.name_zh,
        starts_at=activity.starts_at,
        ends_at=activity.ends_at,
        location=activity.location,
        summary=activity.summary,
        activity_url=(
            f"{settings.frontend_base_url.rstrip('/')}"
            f"{department.portal_path}/activities/{activity.id}"
        ),
    )

    for account_id, email in recipients:
        await dispatcher.send(
            session,
            recipient_email=email,
            template_key=EmailTemplateKey.ACTIVITY_ANNOUNCEMENT,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            recipient_id=account_id,
        )


async def _resolve_audience(
    session: AsyncSession, activity: Activity
) -> list[tuple[UUID, str]]:
    from app.domain.organization.models.membership import DepartmentMembership

    statement = select(UserAccount.id, UserAccount.email).where(
        UserAccount.status == AccountStatus.ACTIVE,
        UserAccount.receives_activity_notices.is_(True),
    )

    if activity.audience is ActivityAudience.DEPARTMENT:
        statement = statement.where(
            select(DepartmentMembership.user_id)
            .where(
                DepartmentMembership.user_id == UserAccount.id,
                DepartmentMembership.department_id == activity.department_id,
                DepartmentMembership.ended_on.is_(None),
            )
            .exists()
        )
    elif activity.audience is ActivityAudience.ALUMNI:
        statement = statement.where(UserAccount.affiliation == AffiliationType.ALUMNUS)

    return list((await session.execute(statement)).all())


async def _load_departments(
    session: AsyncSession, identifiers: set[UUID]
) -> dict[UUID, Department]:
    if not identifiers:
        return {}
    rows = (
        (await session.execute(select(Department).where(Department.id.in_(identifiers))))
        .scalars()
        .all()
    )
    return {department.id: department for department in rows}


async def _require_visible(
    session: AsyncSession, context: AuthorizationContext, activity_id: UUID
) -> Activity:
    statement = _visible_filter(select(Activity).where(Activity.id == activity_id), context)
    activity = (await session.execute(statement)).unique().scalar_one_or_none()
    if activity is None:
        raise ResourceNotFound(
            message_en="That activity could not be found.",
            message_zh="未找到该活动。",
        )
    return activity
