"""Append-only trail of actions that change who can do what.

Permission changes are the operations most likely to be questioned after the fact, so every grant,
revocation, approval, and department reassignment lands here with the acting account attached.

仅追加的操作轨迹。权限变更是事后最容易被追问的操作，因此每一次授予、回收、审批与部门调整
都会连同操作者一并记录。
"""

from __future__ import annotations

import uuid
from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.base import Base, JsonColumn, TimestampMixin, UuidPrimaryKeyMixin


class AuditAction(StrEnum):
    REGISTRATION_APPROVED = "registration_approved"
    REGISTRATION_REJECTED = "registration_rejected"
    ACCOUNT_SUSPENDED = "account_suspended"
    ACCOUNT_REACTIVATED = "account_reactivated"
    MEMBERSHIP_GRANTED = "membership_granted"
    MEMBERSHIP_REVOKED = "membership_revoked"
    MEMBERSHIP_ROLE_CHANGED = "membership_role_changed"
    PRIMARY_DEPARTMENT_CHANGED = "primary_department_changed"
    ROLE_CREATED = "role_created"
    ROLE_UPDATED = "role_updated"
    ROLE_DELETED = "role_deleted"
    DEPARTMENT_CREATED = "department_created"
    DEPARTMENT_UPDATED = "department_updated"
    DOCUMENT_DELETED = "document_deleted"
    BROADCAST_SENT = "broadcast_sent"


class AuditLogEntry(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "audit_log_entry"
    __table_args__ = (Index("ix_audit_log_entry_target", "target_type", "target_id"),)

    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("user_account.id", ondelete="SET NULL")
    )
    action: Mapped[AuditAction] = mapped_column(
        Enum(AuditAction, name="audit_action", native_enum=False, length=40), nullable=False
    )

    target_type: Mapped[str] = mapped_column(String(64), nullable=False)
    target_id: Mapped[uuid.UUID | None] = mapped_column()
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("department.id", ondelete="SET NULL")
    )

    # Human-readable sentence rendered directly in the admin console's activity feed.
    # 可读句子，直接渲染在管理后台的操作流中。
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    # Structured before/after values for the rare case where the summary is not enough.
    # 结构化的变更前后值，供摘要不足以说明问题时查阅。
    context: Mapped[dict] = mapped_column(JsonColumn, default=dict, nullable=False)

    ip_address: Mapped[str | None] = mapped_column(String(64))
