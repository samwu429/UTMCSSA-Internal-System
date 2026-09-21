"""Transport-agnostic email interface.

Two implementations exist: the Resend HTTP client used in deployed environments, and a console
transport used when no provider credential is configured. The console transport is a genuine
development driver, not a stub standing in for a real key - it writes the rendered message to the
log so a developer can read the verification code without a mailbox.

与传输方式无关的邮件接口。系统提供两种实现：部署环境使用的 Resend HTTP 客户端，
以及未配置凭证时使用的控制台传输。后者是真实的开发用驱动而非假密钥占位：
它把渲染后的邮件写入日志，使开发者无需邮箱即可读到验证码。
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Protocol

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class EmailMessage:
    """A rendered message ready to hand to a provider."""

    to: str
    subject: str
    html_body: str
    text_body: str
    reply_to: str | None = None
    tags: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class DeliveryReceipt:
    """Provider acknowledgement, or the reason the attempt failed."""

    accepted: bool
    provider_message_id: str | None = None
    failure_reason: str | None = None


class EmailTransport(Protocol):
    """Anything capable of delivering a rendered message."""

    async def send(self, message: EmailMessage) -> DeliveryReceipt: ...


class ConsoleEmailTransport:
    """Development transport that records messages in the application log."""

    async def send(self, message: EmailMessage) -> DeliveryReceipt:
        logger.info(
            "Email not dispatched: no provider configured. to=%s subject=%s\n%s",
            message.to,
            message.subject,
            message.text_body,
        )
        return DeliveryReceipt(accepted=True, provider_message_id="console-transport")
