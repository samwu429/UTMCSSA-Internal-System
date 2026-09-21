"""Record of every message handed to the email provider.

Two jobs: giving the presidium a plain answer to "did the member actually get the notice", and
letting the daily digest job detect that it already ran today after a restart.

两项用途：让主席团能直接回答「成员到底收到通知没有」，以及让每日摘要任务在重启后判断当天是否已执行。
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from enum import StrEnum

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.base import Base, TimestampMixin, UuidPrimaryKeyMixin


class EmailDeliveryStatus(StrEnum):
    QUEUED = "queued"
    SENT = "sent"
    FAILED = "failed"
    SKIPPED = "skipped"


class EmailTemplateKey(StrEnum):
    """Templates the platform can send, kept as an enum so reporting groups cleanly."""

    VERIFICATION_CODE = "verification_code"
    PASSWORD_RESET_CODE = "password_reset_code"
    REGISTRATION_APPROVED = "registration_approved"
    REGISTRATION_REJECTED = "registration_rejected"
    ACTIVITY_ANNOUNCEMENT = "activity_announcement"
    DEPARTMENT_BROADCAST = "department_broadcast"
    DAILY_DIGEST = "daily_digest"


class EmailDeliveryLog(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "email_delivery_log"
    __table_args__ = (
        Index("ix_email_delivery_log_digest_run", "template_key", "digest_date", "recipient_email"),
    )

    recipient_email: Mapped[str] = mapped_column(String(320), nullable=False)
    recipient_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("user_account.id", ondelete="SET NULL")
    )

    template_key: Mapped[EmailTemplateKey] = mapped_column(
        Enum(EmailTemplateKey, name="email_template_key", native_enum=False, length=32),
        nullable=False,
    )
    subject: Mapped[str] = mapped_column(String(300), nullable=False)

    status: Mapped[EmailDeliveryStatus] = mapped_column(
        Enum(EmailDeliveryStatus, name="email_delivery_status", native_enum=False, length=16),
        default=EmailDeliveryStatus.QUEUED,
        nullable=False,
    )
    provider_message_id: Mapped[str | None] = mapped_column(String(120))
    failure_reason: Mapped[str | None] = mapped_column(Text)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Only set on digest sends; the uniqueness of (template, date, recipient) is what makes the
    # scheduled job safe to run more than once in a day.
    # 仅摘要邮件写入该字段；(模板, 日期, 收件人) 的唯一性使定时任务在一天内重复执行也不会重复发送。
    digest_date: Mapped[date | None] = mapped_column(Date)
