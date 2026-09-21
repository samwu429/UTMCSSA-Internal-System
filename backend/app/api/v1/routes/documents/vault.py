"""Document vault endpoints: categories, files, versions, and downloads."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, File, Form, Query, UploadFile, status
from fastapi.responses import StreamingResponse

from app.api.deps.authentication import ContextDependency, SessionDependency
from app.api.deps.services import StorageDependency
from app.domain.documents.models.enums import DocumentVisibility
from app.domain.documents.schemas.vault import (
    CategoryCreate,
    CategoryNode,
    CategoryUpdate,
    DocumentDetail,
    DocumentPage,
    DocumentUpdate,
    DownloadTicket,
)
from app.domain.documents.services import category_service, vault_service

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/categories", response_model=list[CategoryNode])
async def list_categories(
    session: SessionDependency,
    context: ContextDependency,
    department_id: UUID | None = None,
) -> list[CategoryNode]:
    return await category_service.build_tree(session, context, department_id=department_id)


@router.post(
    "/categories", response_model=CategoryNode, status_code=status.HTTP_201_CREATED
)
async def create_category(
    payload: CategoryCreate,
    session: SessionDependency,
    context: ContextDependency,
) -> CategoryNode:
    return await category_service.create_category(session, context, payload)


@router.patch("/categories/{category_id}", response_model=CategoryNode)
async def update_category(
    category_id: UUID,
    payload: CategoryUpdate,
    session: SessionDependency,
    context: ContextDependency,
) -> CategoryNode:
    return await category_service.update_category(session, context, category_id, payload)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: UUID,
    session: SessionDependency,
    context: ContextDependency,
) -> None:
    await category_service.delete_category(session, context, category_id)


@router.get("/content/{storage_key:path}")
async def stream_document_content(
    storage_key: str,
    session: SessionDependency,
    context: ContextDependency,
    storage: StorageDependency,
) -> StreamingResponse:
    """Serve bytes held by the filesystem driver, re-checking permission for this exact key."""
    version = await vault_service.resolve_version_for_streaming(session, context, storage_key)
    return StreamingResponse(
        storage.stream(version.storage_key),
        media_type=version.content_type,
        headers={
            "Content-Disposition": (
                f'attachment; filename="{version.original_filename}"'
            )
        },
    )


@router.get("", response_model=DocumentPage)
async def list_documents(
    session: SessionDependency,
    context: ContextDependency,
    department_id: UUID | None = None,
    category_id: UUID | None = None,
    search: str | None = None,
    include_archived: bool = False,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
) -> DocumentPage:
    return await vault_service.list_documents(
        session,
        context,
        department_id=department_id,
        category_id=category_id,
        search=search,
        include_archived=include_archived,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=DocumentDetail, status_code=status.HTTP_201_CREATED)
async def upload_document(
    session: SessionDependency,
    context: ContextDependency,
    storage: StorageDependency,
    file: UploadFile = File(...),
    title: str = Form(...),
    category_id: UUID = Form(...),
    department_id: UUID = Form(...),
    description: str | None = Form(default=None),
    visibility: DocumentVisibility = Form(default=DocumentVisibility.DEPARTMENT),
    tags: list[str] = Form(default_factory=list),
) -> DocumentDetail:
    payload = await file.read()
    detail = await vault_service.create_document(
        session,
        context,
        storage,
        department_id=department_id,
        category_id=category_id,
        title=title,
        description=description,
        visibility=visibility,
        tags=tags,
        filename=file.filename or "upload",
        content_type=file.content_type or "application/octet-stream",
        payload=payload,
    )
    return await vault_service.resolve_uploader_names(session, detail)


@router.get("/{document_id}", response_model=DocumentDetail)
async def read_document(
    document_id: UUID,
    session: SessionDependency,
    context: ContextDependency,
) -> DocumentDetail:
    detail = await vault_service.get_document(session, context, document_id)
    return await vault_service.resolve_uploader_names(session, detail)


@router.patch("/{document_id}", response_model=DocumentDetail)
async def update_document(
    document_id: UUID,
    payload: DocumentUpdate,
    session: SessionDependency,
    context: ContextDependency,
) -> DocumentDetail:
    detail = await vault_service.update_document(session, context, document_id, payload)
    return await vault_service.resolve_uploader_names(session, detail)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    session: SessionDependency,
    context: ContextDependency,
    storage: StorageDependency,
) -> None:
    await vault_service.delete_document(session, context, storage, document_id)


@router.post("/{document_id}/versions", response_model=DocumentDetail)
async def upload_document_version(
    document_id: UUID,
    session: SessionDependency,
    context: ContextDependency,
    storage: StorageDependency,
    file: UploadFile = File(...),
    change_note: str | None = Form(default=None),
) -> DocumentDetail:
    payload = await file.read()
    detail = await vault_service.add_version(
        session,
        context,
        storage,
        document_id=document_id,
        filename=file.filename or "upload",
        content_type=file.content_type or "application/octet-stream",
        payload=payload,
        change_note=change_note,
    )
    return await vault_service.resolve_uploader_names(session, detail)


@router.get("/{document_id}/download", response_model=DownloadTicket)
async def request_download(
    document_id: UUID,
    session: SessionDependency,
    context: ContextDependency,
    storage: StorageDependency,
    version_id: UUID | None = None,
) -> DownloadTicket:
    return await vault_service.build_download_ticket(
        session, context, storage, document_id=document_id, version_id=version_id
    )
