"""Local filesystem driver, used in development and for small self-hosted deployments.

Every key is resolved against the configured root and rejected if it escapes it, so a crafted
identifier cannot reach files outside the vault.

本地文件系统驱动，用于开发环境与小规模自托管部署。所有键名均相对配置的根目录解析，
一旦越界即拒绝，避免构造的标识符触及文件库之外的文件。
"""

from __future__ import annotations

import asyncio
import hashlib
from collections.abc import AsyncIterator
from pathlib import Path

from app.core.errors.exceptions import ResourceNotFound
from app.infrastructure.storage.base import RetrievalLocation, StoredObject

STREAM_CHUNK_BYTES = 64 * 1024


class FilesystemDocumentStorage:
    """Writes document bytes beneath a single root directory."""

    def __init__(self, root: Path, download_path_template: str) -> None:
        self._root = root.resolve()
        self._root.mkdir(parents=True, exist_ok=True)
        self._download_path_template = download_path_template

    def _resolve(self, storage_key: str) -> Path:
        candidate = (self._root / storage_key).resolve()
        if not candidate.is_relative_to(self._root):
            raise ResourceNotFound(
                message_en="The requested file could not be located.",
                message_zh="未找到请求的文件。",
            )
        return candidate

    async def write(self, storage_key: str, payload: bytes, content_type: str) -> StoredObject:
        del content_type  # Content type is recorded in the database, not on disk.
        target = self._resolve(storage_key)

        def _write() -> None:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(payload)

        await asyncio.to_thread(_write)
        return StoredObject(
            storage_key=storage_key,
            size_bytes=len(payload),
            checksum_sha256=hashlib.sha256(payload).hexdigest(),
        )

    async def read(self, storage_key: str) -> bytes:
        target = self._resolve(storage_key)
        if not target.is_file():
            raise ResourceNotFound(
                message_en="The requested file could not be located.",
                message_zh="未找到请求的文件。",
            )
        return await asyncio.to_thread(target.read_bytes)

    async def stream(self, storage_key: str) -> AsyncIterator[bytes]:
        target = self._resolve(storage_key)
        if not target.is_file():
            raise ResourceNotFound(
                message_en="The requested file could not be located.",
                message_zh="未找到请求的文件。",
            )
        handle = await asyncio.to_thread(target.open, "rb")
        try:
            while chunk := await asyncio.to_thread(handle.read, STREAM_CHUNK_BYTES):
                yield chunk
        finally:
            await asyncio.to_thread(handle.close)

    async def delete(self, storage_key: str) -> None:
        target = self._resolve(storage_key)
        await asyncio.to_thread(target.unlink, True)

    async def locate(
        self, storage_key: str, filename: str, content_type: str
    ) -> RetrievalLocation:
        del filename, content_type
        return RetrievalLocation(
            url=self._download_path_template.format(storage_key=storage_key),
            is_direct=False,
        )
