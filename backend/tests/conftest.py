"""Shared test fixtures.

Integration tests run against an in-memory SQLite database created from the same metadata the
migration was generated from, so a model change that breaks a query is caught without needing a
PostgreSQL instance in the loop.

集成测试运行在内存 SQLite 上，其结构由生成迁移时所用的同一份元数据创建；
因此破坏查询的模型变更无需依赖 PostgreSQL 实例即可被发现。
"""

from __future__ import annotations

import os
from collections.abc import AsyncIterator

import pytest

# Configuration must be in place before application modules read it through the cached settings.
# 配置须在应用模块通过缓存读取之前就位。
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SCHEDULER_ENABLED", "false")
os.environ.setdefault("RESEND_API_KEY", "")
os.environ.setdefault("JWT_SECRET_KEY", "test-only-signing-key-not-a-real-secret")

from sqlalchemy.ext.asyncio import (  # noqa: E402
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.infrastructure.database.registry import Base  # noqa: E402
from app.infrastructure.email.client.base import (  # noqa: E402
    DeliveryReceipt,
    EmailMessage,
)
from app.infrastructure.email.dispatcher import EmailDispatcher  # noqa: E402


class RecordingEmailTransport:
    """Captures messages instead of delivering them, so tests can assert on what was sent."""

    def __init__(self) -> None:
        self.messages: list[EmailMessage] = []

    async def send(self, message: EmailMessage) -> DeliveryReceipt:
        self.messages.append(message)
        return DeliveryReceipt(accepted=True, provider_message_id=f"test-{len(self.messages)}")


@pytest.fixture
async def session() -> AsyncIterator[AsyncSession]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(bind=engine, expire_on_commit=False, autoflush=False)
    async with factory() as active_session:
        yield active_session

    await engine.dispose()


@pytest.fixture
def transport() -> RecordingEmailTransport:
    return RecordingEmailTransport()


@pytest.fixture
def dispatcher(transport: RecordingEmailTransport) -> EmailDispatcher:
    return EmailDispatcher(transport=transport)
