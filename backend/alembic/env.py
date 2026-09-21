"""Alembic environment wiring.

The target metadata comes from the model registry rather than from individual imports, so a new
table is picked up by autogenerate the moment it is added to the registry. The database URL is
injected here from application settings, which keeps the credential out of ``alembic.ini`` and
therefore out of version control.

目标元数据取自模型注册表而非逐个导入，因此新表只要加入注册表即可被自动生成识别。
数据库连接串在此从应用配置注入，使凭证不出现在 alembic.ini 中，也就不会进入版本库。
"""

from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config.settings import get_settings
from app.infrastructure.database.registry import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata
config.set_main_option("sqlalchemy.url", get_settings().sqlalchemy_url)


def run_migrations_offline() -> None:
    """Emit SQL to stdout without connecting, for review before a production apply."""
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def _apply(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    engine = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with engine.connect() as connection:
        await connection.run_sync(_apply)
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
