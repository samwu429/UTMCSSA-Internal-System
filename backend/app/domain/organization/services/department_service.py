"""Department queries and administration.

Listing is open to any signed-in member because the department list is how the interface labels
people; editing is not. Portal module identifiers are validated against the registry so a typo in
the admin console cannot produce a portal that renders nothing.

部门列表对任何已登录成员开放——界面靠它给成员打标签；编辑权限则不开放。
门户模块标识会对照注册表校验，避免后台输错导致门户渲染为空白。
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config.organization.departments import PortalModule
from app.core.config.organization.offices import PLATFORM_ADMIN_DEPARTMENT_SLUG
from app.core.errors.exceptions import PermissionDenied, ResourceConflict, ResourceNotFound
from app.core.security.authorization.evaluator import AuthorizationContext
from app.core.security.authorization.permissions.catalog import Permission
from app.domain.audit.models.audit_log_entry import AuditAction
from app.domain.audit.services import audit_service
from app.domain.identity.models.enums import AccountStatus
from app.domain.identity.models.user_account import UserAccount
from app.domain.organization.models.department import Department
from app.domain.organization.models.membership import DepartmentMembership
from app.domain.organization.schemas.department import (
    DepartmentCreate,
    DepartmentSummary,
    DepartmentUpdate,
    DepartmentWithHeadcount,
)

_VALID_MODULES = {module.value for module in PortalModule}


def _validate_modules(modules: list[str]) -> list[str]:
    unknown = [module for module in modules if module not in _VALID_MODULES]
    if unknown:
        raise ResourceConflict(
            message_en=f"Unknown portal module(s): {', '.join(unknown)}",
            message_zh=f"未知的门户模块：{'、'.join(unknown)}",
            details={"unknown_modules": unknown, "valid_modules": sorted(_VALID_MODULES)},
        )
    return modules


async def list_departments(
    session: AsyncSession, context: AuthorizationContext | None = None
) -> list[DepartmentWithHeadcount]:
    departments = (
        (
            await session.execute(
                select(Department).order_by(Department.sort_order.asc(), Department.name_zh.asc())
            )
        )
        .scalars()
        .all()
    )

    headcount_rows = await session.execute(
        select(DepartmentMembership.department_id, UserAccount.status, func.count())
        .join(UserAccount, UserAccount.id == DepartmentMembership.user_id)
        .where(DepartmentMembership.ended_on.is_(None))
        .group_by(DepartmentMembership.department_id, UserAccount.status)
    )

    active: dict[UUID, int] = {}
    pending: dict[UUID, int] = {}
    for department_id, status, count in headcount_rows.all():
        if status == AccountStatus.ACTIVE:
            active[department_id] = active.get(department_id, 0) + count
        elif status == AccountStatus.PENDING_APPROVAL:
            pending[department_id] = pending.get(department_id, 0) + count

    hide_platform_admin = context is None or not context.is_platform_administrator
    return [
        DepartmentWithHeadcount(
            **DepartmentSummary.model_validate(department).model_dump(),
            member_count=active.get(department.id, 0),
            pending_count=pending.get(department.id, 0),
        )
        for department in departments
        if not (hide_platform_admin and department.slug == PLATFORM_ADMIN_DEPARTMENT_SLUG)
    ]


async def get_by_slug(
    session: AsyncSession,
    slug: str,
    context: AuthorizationContext | None = None,
) -> Department:
    department = (
        await session.execute(select(Department).where(Department.slug == slug))
    ).scalar_one_or_none()
    if department is None:
        raise ResourceNotFound(
            message_en="That department could not be found.",
            message_zh="未找到该部门。",
        )
    if (
        department.slug == PLATFORM_ADMIN_DEPARTMENT_SLUG
        and (context is None or not context.is_platform_administrator)
    ):
        raise ResourceNotFound(
            message_en="That department could not be found.",
            message_zh="未找到该部门。",
        )
    return department


async def create_department(
    session: AsyncSession, context: AuthorizationContext, payload: DepartmentCreate
) -> DepartmentSummary:
    if not context.has(Permission.ADMIN_MANAGE_DEPARTMENTS):
        raise PermissionDenied(
            message_en="You cannot create departments.",
            message_zh="你没有创建部门的权限。",
        )

    duplicate = (
        await session.execute(select(Department.id).where(Department.slug == payload.slug))
    ).scalar_one_or_none()
    if duplicate is not None:
        raise ResourceConflict(
            message_en="A department with that identifier already exists.",
            message_zh="该部门标识已存在。",
            details={"field": "slug"},
        )

    department = Department(
        slug=payload.slug,
        name_en=payload.name_en,
        name_zh=payload.name_zh,
        summary_en=payload.summary_en,
        summary_zh=payload.summary_zh,
        accent_color=payload.accent_color,
        portal_modules=_validate_modules(payload.portal_modules),
        has_organization_oversight=payload.has_organization_oversight,
        parent_id=payload.parent_id,
        sort_order=payload.sort_order,
    )
    session.add(department)
    await session.flush()

    await audit_service.record(
        session,
        action=AuditAction.DEPARTMENT_CREATED,
        actor_id=context.user_id,
        target_type="department",
        target_id=department.id,
        department_id=department.id,
        summary=f"创建了部门「{department.name_zh}」。",
    )
    return DepartmentSummary.model_validate(department)


async def update_department(
    session: AsyncSession,
    context: AuthorizationContext,
    department_id: UUID,
    payload: DepartmentUpdate,
) -> DepartmentSummary:
    if not context.has(Permission.ADMIN_MANAGE_DEPARTMENTS):
        raise PermissionDenied(
            message_en="You cannot edit departments.",
            message_zh="你没有修改部门的权限。",
        )

    department = await session.get(Department, department_id)
    if department is None:
        raise ResourceNotFound(
            message_en="That department could not be found.",
            message_zh="未找到该部门。",
        )

    changes = payload.model_dump(exclude_unset=True)
    if "portal_modules" in changes and changes["portal_modules"] is not None:
        changes["portal_modules"] = _validate_modules(changes["portal_modules"])

    for field_name, value in changes.items():
        setattr(department, field_name, value)
    await session.flush()

    await audit_service.record(
        session,
        action=AuditAction.DEPARTMENT_UPDATED,
        actor_id=context.user_id,
        target_type="department",
        target_id=department.id,
        department_id=department.id,
        summary=f"修改了部门「{department.name_zh}」的设置。",
        context={"fields": sorted(changes)},
    )
    return DepartmentSummary.model_validate(department)
