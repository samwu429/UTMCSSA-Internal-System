"""Neon connection-string rewriting.

Neon hands out libpq URLs. The application must turn them into the form SQLAlchemy's asyncpg
dialect accepts without losing the host, database, or TLS requirement.

Neon 给出的是 libpq 连接串。应用须将其改写为 SQLAlchemy asyncpg 方言可接受的形式，
且不丢失主机、数据库名或 TLS 要求。
"""

from __future__ import annotations

from app.core.config.settings import normalize_async_postgres_dsn


def test_neon_sslmode_is_translated_for_asyncpg() -> None:
    rewritten = normalize_async_postgres_dsn(
        "postgresql://user:secret@host.neon.tech/db?sslmode=require&channel_binding=require"
    )
    assert rewritten.startswith("postgresql+asyncpg://")
    assert "ssl=require" in rewritten
    assert "sslmode" not in rewritten
    assert "channel_binding" not in rewritten


def test_sqlite_memory_url_is_left_untouched() -> None:
    sqlite_url = "sqlite+aiosqlite:///:memory:"
    assert normalize_async_postgres_dsn(sqlite_url) == sqlite_url
