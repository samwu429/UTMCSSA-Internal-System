"""Presidium administration endpoints: approvals, account status, oversight, and audit."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Query

from app.api.deps.authentication import ContextDependency, SessionDependency
from app.api.deps.services import DispatcherDependency
from app.domain.organization.schemas.administration import (
    AccountStatusChange,
    AdministrationActionResult,
    AuditEntryPage,
    OversightSnapshot,
    PendingRegistration,
    RegistrationApproval,
    RegistrationRejection,
)
from app.domain.organization.services import administration_service

router = APIRouter(prefix="/administration", tags=["administration"])


@router.get("/overview", response_model=OversightSnapshot)
async def read_overview(
    session: SessionDependency,
    context: ContextDependency,
) -> OversightSnapshot:
    return await administration_service.build_overview(session, context)


@router.get("/registrations/pending", response_model=list[PendingRegistration])
async def list_pending_registrations(
    session: SessionDependency,
    context: ContextDependency,
) -> list[PendingRegistration]:
    return await administration_service.list_pending_registrations(session, context)


@router.post(
    "/registrations/{user_id}/approve", response_model=AdministrationActionResult
)
async def approve_registration(
    user_id: UUID,
    payload: RegistrationApproval,
    session: SessionDependency,
    context: ContextDependency,
    dispatcher: DispatcherDependency,
) -> AdministrationActionResult:
    return await administration_service.approve_registration(
        session, context, user_id=user_id, payload=payload, dispatcher=dispatcher
    )


@router.post("/registrations/{user_id}/reject", response_model=AdministrationActionResult)
async def reject_registration(
    user_id: UUID,
    payload: RegistrationRejection,
    session: SessionDependency,
    context: ContextDependency,
    dispatcher: DispatcherDependency,
) -> AdministrationActionResult:
    return await administration_service.reject_registration(
        session, context, user_id=user_id, payload=payload, dispatcher=dispatcher
    )


@router.post("/accounts/{user_id}/status", response_model=AdministrationActionResult)
async def change_account_status(
    user_id: UUID,
    payload: AccountStatusChange,
    session: SessionDependency,
    context: ContextDependency,
) -> AdministrationActionResult:
    return await administration_service.change_account_status(
        session, context, user_id=user_id, payload=payload
    )


@router.get("/audit-log", response_model=AuditEntryPage)
async def list_audit_entries(
    session: SessionDependency,
    context: ContextDependency,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=30, ge=1, le=100),
) -> AuditEntryPage:
    return await administration_service.list_audit_entries(
        session, context, page=page, page_size=page_size
    )
