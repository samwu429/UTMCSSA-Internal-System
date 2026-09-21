"""S3-compatible object storage driver for deployed environments.

Downloads are served by presigned URL so file bytes never pass through the application process.
The presign window is deliberately short: the link is generated the moment a member clicks
download, not stored anywhere.

面向部署环境的 S3 兼容对象存储驱动。下载通过预签名 URL 完成，文件字节不经过应用进程。
预签名有效期刻意设置得很短：链接在成员点击下载的瞬间生成，不做任何持久化。
"""

from __future__ import annotations

import asyncio
import hashlib
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.core.errors.exceptions import ExternalServiceUnavailable, ResourceNotFound
from app.infrastructure.storage.base import RetrievalLocation, StoredObject

PRESIGNED_URL_TTL_SECONDS = 300
STREAM_CHUNK_BYTES = 64 * 1024


class ObjectStoreDocumentStorage:
    """Stores document bytes in an S3-compatible bucket."""

    def __init__(
        self,
        *,
        bucket: str,
        region: str,
        endpoint_url: str | None,
        access_key_id: str,
        secret_access_key: str,
    ) -> None:
        self._bucket = bucket
        self._client = boto3.client(
            "s3",
            region_name=region or None,
            endpoint_url=endpoint_url or None,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            config=Config(signature_version="s3v4", retries={"max_attempts": 3}),
        )

    async def write(self, storage_key: str, payload: bytes, content_type: str) -> StoredObject:
        try:
            await asyncio.to_thread(
                self._client.put_object,
                Bucket=self._bucket,
                Key=storage_key,
                Body=payload,
                ContentType=content_type,
            )
        except (BotoCoreError, ClientError) as error:
            raise ExternalServiceUnavailable(
                message_en="The file store rejected the upload. Try again shortly.",
                message_zh="文件存储服务暂时无法写入，请稍后重试。",
            ) from error

        return StoredObject(
            storage_key=storage_key,
            size_bytes=len(payload),
            checksum_sha256=hashlib.sha256(payload).hexdigest(),
        )

    async def read(self, storage_key: str) -> bytes:
        try:
            response = await asyncio.to_thread(
                self._client.get_object, Bucket=self._bucket, Key=storage_key
            )
        except ClientError as error:
            raise ResourceNotFound(
                message_en="The requested file could not be located.",
                message_zh="未找到请求的文件。",
            ) from error
        return await asyncio.to_thread(response["Body"].read)

    async def stream(self, storage_key: str) -> AsyncIterator[bytes]:
        payload = await self.read(storage_key)
        for offset in range(0, len(payload), STREAM_CHUNK_BYTES):
            yield payload[offset : offset + STREAM_CHUNK_BYTES]

    async def delete(self, storage_key: str) -> None:
        try:
            await asyncio.to_thread(
                self._client.delete_object, Bucket=self._bucket, Key=storage_key
            )
        except (BotoCoreError, ClientError) as error:
            raise ExternalServiceUnavailable(
                message_en="The file store rejected the deletion. Try again shortly.",
                message_zh="文件存储服务暂时无法删除，请稍后重试。",
            ) from error

    async def locate(
        self, storage_key: str, filename: str, content_type: str
    ) -> RetrievalLocation:
        url = await asyncio.to_thread(
            self._client.generate_presigned_url,
            "get_object",
            Params={
                "Bucket": self._bucket,
                "Key": storage_key,
                "ResponseContentType": content_type,
                "ResponseContentDisposition": f'attachment; filename="{filename}"',
            },
            ExpiresIn=PRESIGNED_URL_TTL_SECONDS,
        )
        return RetrievalLocation(
            url=url,
            is_direct=True,
            expires_at=datetime.now(UTC) + timedelta(seconds=PRESIGNED_URL_TTL_SECONDS),
        )
