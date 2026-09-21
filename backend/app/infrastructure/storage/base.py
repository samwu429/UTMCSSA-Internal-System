"""Storage abstraction for document bytes.

The vault stores only a key in the database; where those bytes physically live is a deployment
choice. Keeping the interface this narrow means moving from a local disk to object storage is a
configuration change rather than a schema migration.

文件字节的存储抽象。数据库仅保存键名，字节的物理位置属于部署决策。
接口保持足够窄，使从本地磁盘迁移到对象存储只是配置变更，而非数据库迁移。
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol


@dataclass(frozen=True, slots=True)
class StoredObject:
    """Result of a successful write."""

    storage_key: str
    size_bytes: int
    checksum_sha256: str


@dataclass(frozen=True, slots=True)
class RetrievalLocation:
    """Where a client should fetch the bytes from.

    ``is_direct`` distinguishes a presigned object-store URL, which the browser can follow on its
    own, from a path back into this service, which must be streamed through an authorized handler.

    is_direct 用于区分两种情形：浏览器可直接访问的对象存储预签名 URL，
    以及需经本服务鉴权后流式返回的内部路径。
    """

    url: str
    is_direct: bool
    expires_at: datetime | None = None


class DocumentStorage(Protocol):
    """Byte-level operations the document vault depends on."""

    async def write(self, storage_key: str, payload: bytes, content_type: str) -> StoredObject: ...

    async def read(self, storage_key: str) -> bytes: ...

    async def stream(self, storage_key: str) -> AsyncIterator[bytes]: ...

    async def delete(self, storage_key: str) -> None: ...

    async def locate(
        self, storage_key: str, filename: str, content_type: str
    ) -> RetrievalLocation: ...
