"""Recording of privileged actions.

Callers pass an already-composed Chinese summary because the person reading the log later is a
presidium member, not an engineer reconstructing an event from field names.

调用方传入已写好的中文摘要：日后查阅日志的是主席团成员，而非需要从字段名还原事件的工程师。
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.audit.models.audit_log_entry import AuditAction, AuditLogEntry


async def record(
    session: AsyncSession,
    *,
    action: AuditAction,
    summary: str,
    target_type: str,
    actor_id: UUID | None = None,
    target_id: UUID | None = None,
    department_id: UUID | None = None,
    context: dict | None = None,
    ip_address: str | None = None,
) -> AuditLogEntry:
    entry = AuditLogEntry(
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        department_id=department_id,
        summary=summary,
        context=context or {},
        ip_address=ip_address,
    )
    session.add(entry)
    await session.flush()
    return entry
