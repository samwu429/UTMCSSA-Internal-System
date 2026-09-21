"""Application entry point.

Startup does three things in order: verify the schema is reachable, seed the organization
structure so a fresh deployment is immediately usable, and start the digest scheduler.

启动依次完成三件事：确认数据库可达、写入组织结构种子数据使全新部署立即可用、启动摘要定时任务。
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config.settings import get_settings
from app.core.errors.handlers import register_exception_handlers
from app.domain.organization.services.provisioning_service import provision_organization
from app.infrastructure.database.session import get_engine, session_scope
from app.infrastructure.scheduler.digest_scheduler import build_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()

    async with get_engine().begin() as connection:
        await connection.execute(text("SELECT 1"))

    async with session_scope() as session:
        await provision_organization(session)

    scheduler = build_scheduler()
    if scheduler is not None:
        scheduler.start()
        logger.info(
            "Daily digest scheduled for %02d:%02d %s.",
            settings.daily_digest_hour,
            settings.daily_digest_minute,
            settings.organization_timezone,
        )

    application.state.scheduler = scheduler
    try:
        yield
    finally:
        if scheduler is not None:
            scheduler.shutdown(wait=False)


def create_application() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title="UTMCSSA Internal System",
        description=(
            "Internal operations platform for the UTM Chinese Students and Scholars Association."
        ),
        version="0.1.0",
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None,
        openapi_url=None if settings.is_production else "/openapi.json",
        lifespan=lifespan,
    )

    # Credentials travel in the Authorization header rather than cookies, but the origin list is
    # still explicit so a hostile page cannot read responses from a member's browser.
    # 凭证通过 Authorization 头传递而非 Cookie，但仍显式限定来源，
    # 避免恶意页面在成员浏览器中读取响应内容。
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_base_url],
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    register_exception_handlers(application)
    application.include_router(api_router, prefix=settings.api_base_path)

    @application.get("/health", tags=["operations"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "environment": settings.environment}

    return application


app = create_application()
