"""Assembly and delivery of the morning digest.

The forecast is fetched once per run and shared across every recipient, because it is the same
campus for all of them. Courses and activities are resolved per member, which is the part that
makes the mail worth opening.

天气预报每次运行仅拉取一次并在所有收件人之间共享——校区是同一个。
课程与活动则按成员分别解析，这正是这封邮件值得打开的原因。
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config.settings import get_settings
from app.domain.academics.services import timetable_service
from app.domain.activities.models.activity import Activity, ActivityAudience, ActivityStatus
from app.domain.identity.models.enums import AccountStatus
from app.domain.identity.models.user_account import UserAccount
from app.domain.notifications.models.email_delivery_log import EmailTemplateKey
from app.domain.notifications.schemas.messaging import (
    DailyDigestActivity,
    DailyDigestContent,
    DailyDigestWeather,
)
from app.domain.organization.models.department import Department
from app.domain.organization.models.membership import DepartmentMembership
from app.infrastructure.email.dispatcher import EmailDispatcher, already_delivered_today
from app.infrastructure.email.templates import daily_digest as digest_template
from app.infrastructure.weather.open_meteo import fetch_daily_forecast

logger = logging.getLogger(__name__)

_WEEKDAY_NAMES_ZH = ("星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日")
_WEEKDAY_NAMES_EN = (
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
)


@dataclass(frozen=True, slots=True)
class DigestRunSummary:
    """Counts the admin console displays after a manual or scheduled run."""

    digest_date: date
    candidates: int
    sent: int
    skipped: int
    failed: int


def organization_today() -> date:
    """Current date in the association's timezone rather than the server's."""
    return datetime.now(ZoneInfo(get_settings().organization_timezone)).date()


async def build_content(
    session: AsyncSession,
    account: UserAccount,
    *,
    target_date: date,
    weather: DailyDigestWeather | None,
) -> DailyDigestContent:
    """Everything one member should see for one day."""
    weekday_index = target_date.isoweekday() - 1
    courses = await timetable_service.classes_on(session, account.id, target_date)
    activities = await _activities_on(session, account, target_date)

    return DailyDigestContent(
        digest_date=target_date,
        weekday_en=_WEEKDAY_NAMES_EN[weekday_index],
        weekday_zh=_WEEKDAY_NAMES_ZH[weekday_index],
        recipient_name=account.display_name,
        weather=weather,
        courses=courses,
        activities=activities,
        announcements=[],
    )


async def run_daily_digest(
    session: AsyncSession,
    dispatcher: EmailDispatcher,
    *,
    target_date: date | None = None,
) -> DigestRunSummary:
    """Send the digest to every opted-in active member, skipping anyone already reached today."""
    digest_date = target_date or organization_today()
    weather = await fetch_daily_forecast(digest_date)

    statement = select(UserAccount).where(
        UserAccount.status == AccountStatus.ACTIVE,
        UserAccount.receives_daily_digest.is_(True),
    )
    accounts = (await session.execute(statement)).unique().scalars().all()

    sent = skipped = failed = 0
    for account in accounts:
        if await already_delivered_today(
            session,
            recipient_email=account.email,
            template_key=EmailTemplateKey.DAILY_DIGEST,
            digest_date=digest_date,
        ):
            skipped += 1
            continue

        content = await build_content(
            session, account, target_date=digest_date, weather=weather
        )
        subject, html_body, text_body = digest_template.render(content)
        entry = await dispatcher.send(
            session,
            recipient_email=account.email,
            template_key=EmailTemplateKey.DAILY_DIGEST,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            recipient_id=account.id,
            digest_date=digest_date,
        )
        if entry.sent_at is not None:
            sent += 1
        else:
            failed += 1

    logger.info(
        "Daily digest for %s: %d sent, %d skipped, %d failed.",
        digest_date,
        sent,
        skipped,
        failed,
    )
    return DigestRunSummary(
        digest_date=digest_date,
        candidates=len(accounts),
        sent=sent,
        skipped=skipped,
        failed=failed,
    )


async def _activities_on(
    session: AsyncSession, account: UserAccount, target_date: date
) -> list[DailyDigestActivity]:
    """Published activities starting on ``target_date`` that this member is meant to see."""
    zone = ZoneInfo(get_settings().organization_timezone)
    window_start = datetime.combine(target_date, datetime.min.time(), tzinfo=zone)
    window_end = window_start + timedelta(days=1)

    statement = (
        select(Activity, Department.name_zh)
        .join(Department, Department.id == Activity.department_id)
        .where(
            Activity.status == ActivityStatus.PUBLISHED,
            Activity.starts_at >= window_start,
            Activity.starts_at < window_end,
        )
        .order_by(Activity.starts_at.asc())
    )

    department_ids = [
        membership.department_id
        for membership in account.memberships
        if membership.is_current
    ]
    statement = statement.where(
        (Activity.audience.in_([ActivityAudience.ALL_MEMBERS, ActivityAudience.PUBLIC]))
        | (Activity.department_id.in_(department_ids) if department_ids else False)
    )

    rows = await session.execute(statement)
    return [
        DailyDigestActivity(
            title=activity.title,
            department_name_zh=department_name,
            starts_at=activity.starts_at,
            location=activity.location,
        )
        for activity, department_name in rows.all()
    ]


async def load_digest_candidate(
    session: AsyncSession, user_id
) -> UserAccount | None:
    """Fetch one account with the memberships the digest query depends on."""
    from sqlalchemy.orm import selectinload

    statement = (
        select(UserAccount)
        .where(UserAccount.id == user_id)
        .options(selectinload(UserAccount.memberships).selectinload(DepartmentMembership.department))
    )
    return (await session.execute(statement)).unique().scalar_one_or_none()
