"""The single exit point for outbound mail.

Every send passes through here so that each attempt is written to the delivery log before and
after the provider call. That log is what answers "was the member actually notified" and what lets
the digest job skip recipients it already reached today.

外发邮件的唯一出口。所有发送都经由此处，在调用提供方前后写入投递日志。
该日志既用于回答「成员到底有没有收到通知」，也使每日摘要任务能跳过当天已送达的收件人。
"""

from __future__ import annotations

import logging
from datetime import UTC, date, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config.settings import get_settings
from app.domain.notifications.models.email_delivery_log import (
    EmailDeliveryLog,
    EmailDeliveryStatus,
    EmailTemplateKey,
)
from app.infrastructure.email.client.base import DeliveryReceipt, EmailMessage, EmailTransport
from app.infrastructure.email.client.resend_client import build_transport

logger = logging.getLogger(__name__)


class EmailDispatcher:
    """Renders nothing itself; it records, sends, and records again."""

    def __init__(self, transport: EmailTransport | None = None) -> None:
        self._transport: EmailTransport = transport or build_transport()  # type: ignore[assignment]

    async def send(
        self,
        session: AsyncSession,
        *,
        recipient_email: str,
        template_key: EmailTemplateKey,
        subject: str,
        html_body: str,
        text_body: str,
        recipient_id: UUID | None = None,
        digest_date: date | None = None,
    ) -> EmailDeliveryLog:
        settings = get_settings()
        entry = EmailDeliveryLog(
            recipient_email=recipient_email,
            recipient_id=recipient_id,
            template_key=template_key,
            subject=subject,
            status=EmailDeliveryStatus.QUEUED,
            digest_date=digest_date,
        )
        session.add(entry)
        await session.flush()

        receipt = await self._deliver(
            EmailMessage(
                to=recipient_email,
                subject=subject,
                html_body=html_body,
                text_body=text_body,
                reply_to=settings.email_reply_to_address or None,
                tags={"template": template_key.value},
            )
        )

        if receipt.accepted:
            entry.status = EmailDeliveryStatus.SENT
            entry.sent_at = datetime.now(UTC)
            entry.provider_message_id = receipt.provider_message_id
        else:
            entry.status = EmailDeliveryStatus.FAILED
            entry.failure_reason = receipt.failure_reason

        await session.flush()
        return entry

    async def _deliver(self, message: EmailMessage) -> DeliveryReceipt:
        try:
            return await self._transport.send(message)
        except Exception as error:  # noqa: BLE001 - a transport fault must not abort a broadcast.
            logger.exception("Unexpected email transport fault for %s", message.to)
            return DeliveryReceipt(accepted=False, failure_reason=str(error))


async def already_delivered_today(
    session: AsyncSession,
    *,
    recipient_email: str,
    template_key: EmailTemplateKey,
    digest_date: date,
) -> bool:
    """Whether this recipient already received this digest, making a rerun safe."""
    statement = select(EmailDeliveryLog.id).where(
        EmailDeliveryLog.recipient_email == recipient_email,
        EmailDeliveryLog.template_key == template_key,
        EmailDeliveryLog.digest_date == digest_date,
        EmailDeliveryLog.status == EmailDeliveryStatus.SENT,
    )
    return (await session.execute(statement.limit(1))).scalar_one_or_none() is not None
