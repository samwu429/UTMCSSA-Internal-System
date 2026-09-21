"""Permission set and department placement endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, status

from app.api.deps.authentication import ContextDependency, SessionDependency
from app.domain.identity.schemas.session_profile import MembershipSummary
from app.domain.organization.schemas.role import (
    MembershipAssignment,
    MembershipUpdate,
    PermissionCatalog,
    RoleCreate,
    RoleDetail,
    RoleSummary,
    RoleUpdate,
)
from app.domain.organization.services import membership_service, role_service

router = APIRouter(tags=["permissions"])


@router.get("/roles/permission-catalog", response_model=PermissionCatalog)
async def read_permission_catalog(context: ContextDependency) -> PermissionCatalog:
    del context
    return role_service.build_permission_catalog()


@router.get("/roles", response_model=list[RoleSummary])
async def list_roles(
    session: SessionDependency,
    context: ContextDependency,
    department_id: UUID | None = None,
) -> list[RoleSummary]:
    return await role_service.list_roles(session, context, department_id=department_id)


@router.post("/roles", response_model=RoleDetail, status_code=status.HTTP_201_CREATED)
async def create_role(
    payload: RoleCreate,
    session: SessionDependency,
    context: ContextDependency,
) -> RoleDetail:
    return await role_service.create_role(session, context, payload)


@router.get("/roles/{role_id}", response_model=RoleDetail)
async def read_role(
    role_id: UUID,
    session: SessionDependency,
    context: ContextDependency,
) -> RoleDetail:
    return await role_service.get_role(session, context, role_id)


@router.patch("/roles/{role_id}", response_model=RoleDetail)
async def update_role(
    role_id: UUID,
    payload: RoleUpdate,
    session: SessionDependency,
    context: ContextDependency,
) -> RoleDetail:
    return await role_service.update_role(session, context, role_id, payload)


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: UUID,
    session: SessionDependency,
    context: ContextDependency,
) -> None:
    await role_service.delete_role(session, context, role_id)


@router.post(
    "/memberships", response_model=MembershipSummary, status_code=status.HTTP_201_CREATED
)
async def assign_membership(
    payload: MembershipAssignment,
    session: SessionDependency,
    context: ContextDependency,
) -> MembershipSummary:
    return await membership_service.assign(session, context, payload)


@router.patch("/memberships/{membership_id}", response_model=MembershipSummary)
async def update_membership(
    membership_id: UUID,
    payload: MembershipUpdate,
    session: SessionDependency,
    context: ContextDependency,
) -> MembershipSummary:
    return await membership_service.modify(session, context, membership_id, payload)


@router.delete("/memberships/{membership_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_membership(
    membership_id: UUID,
    session: SessionDependency,
    context: ContextDependency,
) -> None:
    await membership_service.revoke(session, context, membership_id)
