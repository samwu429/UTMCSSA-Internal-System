"""Cron trigger for the morning digest.

The job is safe to run more than once a day: delivery is keyed on (template, date, recipient), so
a restart at 07:05 does not produce a second copy for anyone already reached at 07:00.

晨间摘要的定时触发。该任务允许一天内多次执行：投递以（模板, 日期, 收件人）为键，
07:05 的重启不会给 07:00 已送达的成员再发一封。
"""

from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config.settings import get_settings
from app.domain.notifications.services.digest_service import run_daily_digest
from app.infrastructure.database.session import session_scope
from app.infrastructure.email.dispatcher import EmailDispatcher

logger = logging.getLogger(__name__)

DAILY_DIGEST_JOB_ID = "daily-digest"


async def _execute_daily_digest() -> None:
    async with session_scope() as session:
        await run_daily_digest(session, EmailDispatcher())


def build_scheduler() -> AsyncIOScheduler | None:
    """Configure the scheduler, or return ``None`` when scheduling is disabled."""
    settings = get_settings()
    if not settings.scheduler_enabled:
        logger.info("Scheduler disabled by configuration; the daily digest will not run.")
        return None

    scheduler = AsyncIOScheduler(timezone=settings.organization_timezone)
    scheduler.add_job(
        _execute_daily_digest,
        trigger=CronTrigger(
            hour=settings.daily_digest_hour,
            minute=settings.daily_digest_minute,
            timezone=settings.organization_timezone,
        ),
        id=DAILY_DIGEST_JOB_ID,
        replace_existing=True,
        # A missed window is worth catching up on within the hour, but a digest delivered late in
        # the evening is noise rather than information.
        # 错过的窗口值得在一小时内补发，但傍晚才送达的晨间摘要只是噪音。
        misfire_grace_time=3600,
        coalesce=True,
        max_instances=1,
    )
    return scheduler
