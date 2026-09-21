"""Document storage, retrieval, and version history.

Read scoping combines two independent conditions: which departments the viewer may read at all,
and the visibility a document was filed under. A file marked for the whole association is readable
by any member with vault access; a file marked presidium-only is not, regardless of department.

读取范围由两个独立条件共同决定：查看者可读取哪些部门，以及文件归档时选择的可见性。
标记为全社团的文件对任何有文件库访问权的成员可读；标记为仅主席团的文件则不论部门均不可读。
"""

from __future__ import annotations

import re
import uuid
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config.settings import get_settings
from app.core.errors.exceptions import PermissionDenied, ResourceNotFound, ValidationFailed
from app.core.security.authorization.evaluator import AuthorizationContext
from app.core.security.authorization.permissions.catalog import Permission
from app.domain.audit.models.audit_log_entry import AuditAction
from app.domain.audit.services import audit_service
from app.domain.documents.models.category import DocumentCategory
from app.domain.documents.models.document import Document, DocumentVersion
from app.domain.documents.models.enums import DocumentVisibility
from app.domain.documents.schemas.vault import (
    DocumentDetail,
    DocumentPage,
    DocumentSummary,
    DocumentUpdate,
    DocumentVersionSummary,
    DownloadTicket,
)
from app.domain.identity.models.user_account import UserAccount
from app.domain.organization.models.department import Department
from app.infrastructure.storage.base import DocumentStorage

MAX_PAGE_SIZE = 100

# Filenames are rewritten before they reach storage: only the extension is preserved and the stem
# is replaced by a generated identifier, so nothing a member types becomes part of a path.
# 文件名在进入存储前被重写：仅保留扩展名，主干替换为生成的标识符，
# 使成员输入的任何内容都不会成为路径的一部分。
_EXTENSION_PATTERN = re.compile(r"^[A-Za-z0-9]{1,12}$")


def _storage_key(department_slug: str, document_id: UUID, filename: str) -> str:
    _, _, extension = filename.rpartition(".")
    suffix = f".{extension.lower()}" if _EXTENSION_PATTERN.match(extension) else ""
    return f"{department_slug}/{document_id}/{uuid.uuid4().hex}{suffix}"


def _readable_filter(statement: Select, context: AuthorizationContext) -> Select:
    if not context.has(Permission.DOCUMENTS_VIEW):
        raise PermissionDenied(
            message_en="You do not have access to the document vault.",
            message_zh="你没有访问文件库的权限。",
        )

    if context.departments_allowing(Permission.DOCUMENTS_VIEW_ALL_DEPARTMENTS) is None:
        return statement

    readable_departments = context.departments_allowing(Permission.DOCUMENTS_VIEW) or frozenset()
    conditions = [Document.visibility == DocumentVisibility.ORGANIZATION]
    if readable_departments:
        conditions.append(
            (Document.department_id.in_(readable_departments))
            & (Document.visibility == DocumentVisibility.DEPARTMENT)
        )
    if context.has_organization_reach:
        conditions.append(Document.visibility == DocumentVisibility.PRESIDIUM_ONLY)
    return statement.where(or_(*conditions))


def _to_version_summary(
    version: DocumentVersion, uploader_name: str | None = None
) -> DocumentVersionSummary:
    return DocumentVersionSummary(
        id=version.id,
        version_number=version.version_number,
        original_filename=version.original_filename,
        content_type=version.content_type,
        size_bytes=version.size_bytes,
        checksum_sha256=version.checksum_sha256,
        change_note=version.change_note,
        uploaded_by_id=version.uploaded_by_id,
        uploaded_by_name=uploader_name,
        created_at=version.created_at,
    )


def _to_summary(document: Document) -> DocumentSummary:
    latest = document.versions[0] if document.versions else None
    return DocumentSummary(
        id=document.id,
        title=document.title,
        description=document.description,
        category_id=document.category_id,
        category_name_zh=document.category.name_zh if document.category else None,
        department_id=document.department_id,
        visibility=document.visibility,
        tags=list(document.tags or []),
        is_archived=document.is_archived,
        latest_version=_to_version_summary(latest) if latest else None,
        updated_at=document.updated_at,
    )


def _to_detail(document: Document) -> DocumentDetail:
    return DocumentDetail(
        **_to_summary(document).model_dump(),
        versions=[_to_version_summary(version) for version in document.versions],
        uploaded_by_id=document.uploaded_by_id,
    )


def _with_related(statement: Select) -> Select:
    return statement.options(
        selectinload(Document.category),
        selectinload(Document.versions),
    )


async def list_documents(
    session: AsyncSession,
    context: AuthorizationContext,
    *,
    department_id: UUID | None = None,
    category_id: UUID | None = None,
    search: str | None = None,
    include_archived: bool = False,
    page: int = 1,
    page_size: int = 25,
) -> DocumentPage:
    page = max(page, 1)
    page_size = min(max(page_size, 1), MAX_PAGE_SIZE)

    statement = _readable_filter(select(Document), context)
    if not include_archived:
        statement = statement.where(Document.archived_at.is_(None))
    if department_id is not None:
        statement = statement.where(Document.department_id == department_id)
    if category_id is not None:
        statement = statement.where(Document.category_id == category_id)
    if search:
        pattern = f"%{search.strip().lower()}%"
        statement = statement.where(
            or_(
                func.lower(Document.title).like(pattern),
                func.lower(func.coalesce(Document.description, "")).like(pattern),
            )
        )

    total = (
        await session.execute(select(func.count()).select_from(statement.subquery()))
    ).scalar_one()

    rows = (
        (
            await session.execute(
                _with_related(statement)
                .order_by(Document.updated_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        .unique()
        .scalars()
        .all()
    )

    return DocumentPage(
        items=[_to_summary(document) for document in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


async def get_document(
    session: AsyncSession, context: AuthorizationContext, document_id: UUID
) -> DocumentDetail:
    document = await _require_readable(session, context, document_id)
    return _to_detail(document)


async def create_document(
    session: AsyncSession,
    context: AuthorizationContext,
    storage: DocumentStorage,
    *,
    department_id: UUID,
    category_id: UUID,
    title: str,
    description: str | None,
    visibility: DocumentVisibility,
    tags: list[str],
    filename: str,
    content_type: str,
    payload: bytes,
) -> DocumentDetail:
    if not context.has(Permission.DOCUMENTS_UPLOAD, department_id=department_id):
        raise PermissionDenied(
            message_en="You cannot upload files to this department.",
            message_zh="你没有向该部门上传文件的权限。",
        )
    _assert_payload_acceptable(payload)

    category = await session.get(DocumentCategory, category_id)
    department = await session.get(Department, department_id)
    if category is None or department is None:
        raise ResourceNotFound(
            message_en="The category or department could not be found.",
            message_zh="未找到对应的分类或部门。",
        )

    document = Document(
        title=title.strip(),
        description=description,
        category_id=category.id,
        department_id=department.id,
        visibility=visibility,
        tags=tags,
        uploaded_by_id=context.user_id,
    )
    session.add(document)
    await session.flush()

    await _append_version(
        session,
        storage,
        document=document,
        department_slug=department.slug,
        filename=filename,
        content_type=content_type,
        payload=payload,
        change_note=None,
        uploader_id=context.user_id,
    )

    await session.refresh(document)
    return _to_detail(document)


async def add_version(
    session: AsyncSession,
    context: AuthorizationContext,
    storage: DocumentStorage,
    *,
    document_id: UUID,
    filename: str,
    content_type: str,
    payload: bytes,
    change_note: str | None,
) -> DocumentDetail:
    document = await _require_readable(session, context, document_id)
    if not context.has(Permission.DOCUMENTS_UPLOAD, department_id=document.department_id):
        raise PermissionDenied(
            message_en="You cannot upload new versions of this file.",
            message_zh="你没有为该文件上传新版本的权限。",
        )
    _assert_payload_acceptable(payload)

    department = await session.get(Department, document.department_id)
    await _append_version(
        session,
        storage,
        document=document,
        department_slug=department.slug if department else "shared",
        filename=filename,
        content_type=content_type,
        payload=payload,
        change_note=change_note,
        uploader_id=context.user_id,
    )

    await session.refresh(document)
    return _to_detail(document)


async def update_document(
    session: AsyncSession,
    context: AuthorizationContext,
    document_id: UUID,
    payload: DocumentUpdate,
) -> DocumentDetail:
    document = await _require_readable(session, context, document_id)
    if not context.has(Permission.DOCUMENTS_EDIT, department_id=document.department_id):
        raise PermissionDenied(
            message_en="You cannot edit this file.",
            message_zh="你没有修改该文件的权限。",
        )

    changes = payload.model_dump(exclude_unset=True)
    archived = changes.pop("is_archived", None)
    for field_name, value in changes.items():
        setattr(document, field_name, value)
    if archived is not None:
        document.archived_at = datetime.now(UTC) if archived else None

    await session.flush()
    await session.refresh(document)
    return _to_detail(document)


async def delete_document(
    session: AsyncSession,
    context: AuthorizationContext,
    storage: DocumentStorage,
    document_id: UUID,
) -> None:
    document = await _require_readable(session, context, document_id)
    if not context.has(Permission.DOCUMENTS_DELETE, department_id=document.department_id):
        raise PermissionDenied(
            message_en="You cannot delete this file.",
            message_zh="你没有删除该文件的权限。",
        )

    title = document.title
    for version in list(document.versions):
        await storage.delete(version.storage_key)

    await session.delete(document)
    await session.flush()

    await audit_service.record(
        session,
        action=AuditAction.DOCUMENT_DELETED,
        actor_id=context.user_id,
        target_type="document",
        target_id=document_id,
        department_id=document.department_id,
        summary=f"删除了文件「{title}」及其全部历史版本。",
    )


async def build_download_ticket(
    session: AsyncSession,
    context: AuthorizationContext,
    storage: DocumentStorage,
    *,
    document_id: UUID,
    version_id: UUID | None = None,
) -> DownloadTicket:
    document = await _require_readable(session, context, document_id)
    version = _select_version(document, version_id)

    location = await storage.locate(
        version.storage_key, version.original_filename, version.content_type
    )
    return DownloadTicket(
        url=location.url,
        filename=version.original_filename,
        content_type=version.content_type,
        size_bytes=version.size_bytes,
        expires_at=location.expires_at,
    )


async def resolve_version_for_streaming(
    session: AsyncSession, context: AuthorizationContext, storage_key: str
) -> DocumentVersion:
    """Re-authorize a storage key before the local driver streams its bytes.

    The filesystem driver hands the browser a path back into this service, so the permission check
    must happen again here rather than being assumed from the earlier ticket request.

    文件系统驱动返回的是指向本服务的路径，因此必须在此重新鉴权，
    而不能沿用上一步申请下载凭据时的判定结果。
    """
    statement = (
        select(DocumentVersion)
        .join(Document, Document.id == DocumentVersion.document_id)
        .where(DocumentVersion.storage_key == storage_key)
    )
    statement = _readable_filter(statement, context)
    version = (await session.execute(statement)).unique().scalar_one_or_none()
    if version is None:
        raise ResourceNotFound(
            message_en="The requested file could not be located.",
            message_zh="未找到请求的文件。",
        )
    return version


def _select_version(document: Document, version_id: UUID | None) -> DocumentVersion:
    if version_id is None:
        if not document.versions:
            raise ResourceNotFound(
                message_en="This file has no uploaded content yet.",
                message_zh="该文件尚未上传任何内容。",
            )
        return document.versions[0]

    for version in document.versions:
        if version.id == version_id:
            return version
    raise ResourceNotFound(
        message_en="That version could not be found.",
        message_zh="未找到该版本。",
    )


def _assert_payload_acceptable(payload: bytes) -> None:
    settings = get_settings()
    if not payload:
        raise ValidationFailed(
            message_en="The uploaded file is empty.",
            message_zh="上传的文件为空。",
            details={"field": "file"},
        )
    if len(payload) > settings.storage_max_upload_bytes:
        limit_mb = settings.storage_max_upload_bytes // (1024 * 1024)
        raise ValidationFailed(
            message_en=f"Files must be {limit_mb} MB or smaller.",
            message_zh=f"单个文件不得超过 {limit_mb} MB。",
            details={"field": "file", "limit_bytes": settings.storage_max_upload_bytes},
        )


async def _append_version(
    session: AsyncSession,
    storage: DocumentStorage,
    *,
    document: Document,
    department_slug: str,
    filename: str,
    content_type: str,
    payload: bytes,
    change_note: str | None,
    uploader_id: UUID | None,
) -> DocumentVersion:
    next_number = (
        await session.execute(
            select(func.coalesce(func.max(DocumentVersion.version_number), 0) + 1).where(
                DocumentVersion.document_id == document.id
            )
        )
    ).scalar_one()

    key = _storage_key(department_slug, document.id, filename)
    stored = await storage.write(key, payload, content_type)

    version = DocumentVersion(
        document_id=document.id,
        version_number=next_number,
        storage_key=stored.storage_key,
        original_filename=filename[:300],
        content_type=content_type[:160],
        size_bytes=stored.size_bytes,
        checksum_sha256=stored.checksum_sha256,
        uploaded_by_id=uploader_id,
        change_note=change_note,
    )
    session.add(version)
    await session.flush()

    document.current_version_id = version.id
    await session.flush()
    return version


async def _require_readable(
    session: AsyncSession, context: AuthorizationContext, document_id: UUID
) -> Document:
    statement = _readable_filter(select(Document).where(Document.id == document_id), context)
    document = (
        (await session.execute(_with_related(statement))).unique().scalar_one_or_none()
    )
    if document is None:
        raise ResourceNotFound(
            message_en="That file could not be found.",
            message_zh="未找到该文件。",
        )
    return document


async def resolve_uploader_names(
    session: AsyncSession, detail: DocumentDetail
) -> DocumentDetail:
    """Attach display names to a detail payload in a single lookup."""
    identifiers = {
        version.uploaded_by_id for version in detail.versions if version.uploaded_by_id
    }
    if detail.uploaded_by_id:
        identifiers.add(detail.uploaded_by_id)
    if not identifiers:
        return detail

    rows = await session.execute(
        select(UserAccount.id, UserAccount.legal_name, UserAccount.preferred_name).where(
            UserAccount.id.in_(identifiers)
        )
    )
    names = {
        identifier: preferred or legal for identifier, legal, preferred in rows.all()
    }

    detail.uploaded_by_name = names.get(detail.uploaded_by_id)
    for version in detail.versions:
        version.uploaded_by_name = names.get(version.uploaded_by_id)
    if detail.latest_version is not None:
        detail.latest_version.uploaded_by_name = names.get(detail.latest_version.uploaded_by_id)
    return detail
