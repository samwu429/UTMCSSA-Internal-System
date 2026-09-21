"""Department listing, portal configuration, and administration endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter

from app.api.deps.authentication import ContextDependency, SessionDependency
from app.domain.identity.schemas.session_profile import PortalConfiguration
from app.domain.identity.services.session_profile_service import to_portal_configuration
from app.domain.organization.schemas.department import (
    DepartmentCreate,
    DepartmentSummary,
    DepartmentUpdate,
    DepartmentWithHeadcount,
)
from app.domain.organization.services import department_service

router = APIRouter(prefix="/departments", tags=["organization"])


@router.get("", response_model=list[DepartmentWithHeadcount])
async def list_departments(
    session: SessionDependency,
    context: ContextDependency,
) -> list[DepartmentWithHeadcount]:
    del context
    return await department_service.list_departments(session)


@router.post("", response_model=DepartmentSummary, status_code=201)
async def create_department(
    payload: DepartmentCreate,
    session: SessionDependency,
    context: ContextDependency,
) -> DepartmentSummary:
    return await department_service.create_department(session, context, payload)


@router.get("/{slug}", response_model=DepartmentSummary)
async def read_department(
    slug: str,
    session: SessionDependency,
    context: ContextDependency,
) -> DepartmentSummary:
    del context
    department = await department_service.get_by_slug(session, slug)
    return DepartmentSummary.model_validate(department)


@router.get("/{slug}/portal", response_model=PortalConfiguration)
async def read_portal_configuration(
    slug: str,
    session: SessionDependency,
    context: ContextDependency,
) -> PortalConfiguration:
    """Theme and module list for a department portal.

    Readable by any active member so that a person holding two memberships can switch portals
    without a second sign-in; the data returned is presentation configuration, not department
    content.

    任何在职成员均可读取，使兼任两个部门的成员无需重新登录即可切换门户；
    返回的仅是展示配置，不包含部门业务数据。
    """
    del context
    department = await department_service.get_by_slug(session, slug)
    return to_portal_configuration(department)


@router.patch("/{department_id}", response_model=DepartmentSummary)
async def update_department(
    department_id: UUID,
    payload: DepartmentUpdate,
    session: SessionDependency,
    context: ContextDependency,
) -> DepartmentSummary:
    return await department_service.update_department(session, context, department_id, payload)
