"""Resend HTTP transport.

Kept to a single POST against the messages endpoint. Provider errors are converted into a failed
receipt rather than an exception so one undeliverable address cannot abort a broadcast to two
hundred members.

仅向 Resend 的消息接口发起一次 POST。提供方错误会转换为失败回执而非抛出异常，
避免单个无法投递的地址中断面向两百名成员的群发。
"""

from __future__ import annotations

import logging

import httpx

from app.core.config.settings import get_settings
from app.infrastructure.email.client.base import DeliveryReceipt, EmailMessage

logger = logging.getLogger(__name__)

RESEND_MESSAGES_ENDPOINT = "https://api.resend.com/emails"
REQUEST_TIMEOUT_SECONDS = 15.0


class ResendEmailTransport:
    """Delivers messages through the Resend API."""

    def __init__(self, api_key: str, from_address: str) -> None:
        self._api_key = api_key
        self._from_address = from_address

    async def send(self, message: EmailMessage) -> DeliveryReceipt:
        payload: dict[str, object] = {
            "from": self._from_address,
            "to": [message.to],
            "subject": message.subject,
            "html": message.html_body,
            "text": message.text_body,
        }
        if message.reply_to:
            payload["reply_to"] = message.reply_to
        if message.tags:
            payload["tags"] = [
                {"name": name, "value": value} for name, value in message.tags.items()
            ]

        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
                response = await client.post(
                    RESEND_MESSAGES_ENDPOINT,
                    json=payload,
                    headers={"Authorization": f"Bearer {self._api_key}"},
                )
        except httpx.HTTPError as error:
            logger.warning("Email transport failed for %s: %s", message.to, error)
            return DeliveryReceipt(accepted=False, failure_reason=str(error))

        if response.status_code >= 400:
            # The provider body can echo request content, so only the status and provider error
            # text are logged; the API key never appears in either.
            # 提供方返回体可能回显请求内容，因此仅记录状态码与错误文本；API key 不会出现在其中。
            reason = f"HTTP {response.status_code}: {response.text[:300]}"
            logger.warning("Email rejected for %s: %s", message.to, reason)
            return DeliveryReceipt(accepted=False, failure_reason=reason)

        body = response.json() if response.content else {}
        return DeliveryReceipt(accepted=True, provider_message_id=body.get("id"))


def build_transport() -> object:
    """Choose the transport implied by the current configuration."""
    from app.infrastructure.email.client.base import ConsoleEmailTransport

    settings = get_settings()
    if not settings.resend_api_key:
        logger.info("RESEND_API_KEY is unset; falling back to the console email transport.")
        return ConsoleEmailTransport()
    return ResendEmailTransport(settings.resend_api_key, settings.email_from_address)
