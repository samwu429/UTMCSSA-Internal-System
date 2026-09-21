"""Selection of the storage driver implied by configuration."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from app.core.config.settings import get_settings
from app.infrastructure.storage.base import DocumentStorage
from app.infrastructure.storage.drivers.filesystem import FilesystemDocumentStorage
from app.infrastructure.storage.drivers.object_store import ObjectStoreDocumentStorage

# Path the filesystem driver hands back for downloads, resolved by the vault's streaming route.
# 文件系统驱动返回的下载路径，由文件库的流式路由解析。
_LOCAL_DOWNLOAD_TEMPLATE = "/api/v1/documents/content/{storage_key}"


@lru_cache(maxsize=1)
def get_document_storage() -> DocumentStorage:
    settings = get_settings()
    if settings.storage_driver.lower() == "s3":
        return ObjectStoreDocumentStorage(
            bucket=settings.storage_s3_bucket,
            region=settings.storage_s3_region,
            endpoint_url=settings.storage_s3_endpoint_url or None,
            access_key_id=settings.storage_s3_access_key_id,
            secret_access_key=settings.storage_s3_secret_access_key,
        )
    return FilesystemDocumentStorage(
        root=Path(settings.storage_local_root),
        download_path_template=_LOCAL_DOWNLOAD_TEMPLATE,
    )
