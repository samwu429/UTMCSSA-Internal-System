"""Document vault payloads: the category tree, file records, and version history."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.documents.models.enums import DocumentKind, DocumentVisibility


class CategoryNode(BaseModel):
    """A node in the filing tree, carrying its own children so one request renders the sidebar."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name_en: str
    name_zh: str
    description: str | None = None
    kind: DocumentKind
    department_id: UUID | None = None
    parent_id: UUID | None = None
    is_system_managed: bool
    sort_order: int
    document_count: int = 0
    children: list[CategoryNode] = Field(default_factory=list)


class CategoryCreate(BaseModel):
    slug: str = Field(min_length=1, max_length=80, pattern="^[a-z0-9][a-z0-9-]*$")
    name_en: str = Field(min_length=1, max_length=160)
    name_zh: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=1000)
    kind: DocumentKind = DocumentKind.GOVERNANCE
    department_id: UUID | None = None
    parent_id: UUID | None = None
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name_en: str | None = Field(default=None, min_length=1, max_length=160)
    name_zh: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=1000)
    kind: DocumentKind | None = None
    parent_id: UUID | None = None
    sort_order: int | None = None


class DocumentVersionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    version_number: int
    original_filename: str
    content_type: str
    size_bytes: int
    checksum_sha256: str
    change_note: str | None = None
    uploaded_by_id: UUID | None = None
    uploaded_by_name: str | None = None
    created_at: datetime


class DocumentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str | None = None
    category_id: UUID
    category_name_zh: str | None = None
    department_id: UUID
    department_slug: str | None = None
    department_name_zh: str | None = None
    visibility: DocumentVisibility
    tags: list[str] = Field(default_factory=list)
    is_archived: bool = False
    latest_version: DocumentVersionSummary | None = None
    updated_at: datetime


class DocumentDetail(DocumentSummary):
    versions: list[DocumentVersionSummary] = Field(default_factory=list)
    uploaded_by_id: UUID | None = None
    uploaded_by_name: str | None = None


class DocumentPage(BaseModel):
    items: list[DocumentSummary]
    total: int
    page: int
    page_size: int


class DocumentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    description: str | None = Field(default=None, max_length=2000)
    category_id: UUID | None = None
    visibility: DocumentVisibility | None = None
    tags: list[str] | None = None
    is_archived: bool | None = None


class DownloadTicket(BaseModel):
    """Short-lived location a browser can fetch the bytes from.

    Object storage returns a presigned URL; the local driver streams through the API instead, in
    which case ``url`` points back at this service.

    对象存储返回预签名 URL；本地驱动则由 API 直接流式返回，此时 url 指向本服务自身。
    """

    url: str
    filename: str
    content_type: str
    size_bytes: int
    expires_at: datetime | None = None
