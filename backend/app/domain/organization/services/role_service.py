"""Management of permission sets.

Two rules protect the organization from locking itself out. A role may never be granted a
permission the editor does not themselves hold, and a system-managed role may be renamed or
retuned but never deleted.

两条规则防止组织把自己锁在门外：编辑者不能把自己没有的权限写进某个角色；
系统角色可重命名、可调整权限，但不可删除。
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config.organization.offices import (
    PLATFORM_ADMINISTRATOR_ROLE_KEY,
    RETIRED_OFFICER_ROLE_KEY,
)
from app.core.errors.exceptions import PermissionDenied, ResourceConflict, ResourceNotFound
from app.core.security.authorization.evaluator import AuthorizationContext
from app.core.security.authorization.permissions.catalog import (
    PERMISSION_GROUPS,
    Permission,
    describe,
)
from app.domain.organization.models.membership import DepartmentMembership
from app.domain.organization.models.role import Role, RolePermission
from app.domain.organization.schemas.role import (
    PermissionCatalog,
    PermissionGroupView,
    PermissionOption,
    RoleCreate,
    RoleDetail,
    RoleSummary,
    RoleUpdate,
)


def build_permission_catalog() -> PermissionCatalog:
    """Grouped, bilingual permission list the admin console renders as checkboxes."""
    groups: list[PermissionGroupView] = []
    for group in PERMISSION_GROUPS:
        options = []
        for permission in group.permissions:
            label_en, label_zh = describe(permission)
            options.append(
                PermissionOption(value=permission.value, label_en=label_en, label_zh=label_zh)
            )
        groups.append(
            PermissionGroupView(
                key=group.key,
                label_en=group.label_en,
                label_zh=group.label_zh,
                options=options,
            )
        )
    return PermissionCatalog(groups=groups)


def _parse_permissions(values: list[str]) -> set[Permission]:
    parsed: set[Permission] = set()
    for value in values:
        try:
            parsed.add(Permission(value))
        except ValueError as error:
            raise ResourceConflict(
                message_en=f"Unknown permission: {value}",
                message_zh=f"未知权限项：{value}",
                details={"permission": value},
            ) from error
    return parsed


def _assert_editor_holds(context: AuthorizationContext, requested: set[Permission]) -> None:
    held = context.granted_permissions()
    excess = requested - held
    if excess:
        label_zh = "、".join(describe(permission)[1] for permission in sorted(excess))
        raise PermissionDenied(
            message_en="You cannot grant a permission you do not hold yourself.",
            message_zh=f"你不能授予自己也不具备的权限：{label_zh}。",
            details={"missing": sorted(permission.value for permission in excess)},
        )


async def _assignment_counts(session: AsyncSession) -> dict[UUID, int]:
    rows = await session.execute(
        select(DepartmentMembership.role_id, func.count())
        .where(DepartmentMembership.ended_on.is_(None))
        .group_by(DepartmentMembership.role_id)
    )
    return {role_id: count for role_id, count in rows.all()}


def _to_summary(role: Role, assigned: int) -> RoleSummary:
    return RoleSummary(
        id=role.id,
        key=role.key,
        name_en=role.name_en,
        name_zh=role.name_zh,
        description_en=role.description_en,
        description_zh=role.description_zh,
        scope=role.scope,
        department_id=role.department_id,
        is_system_managed=role.is_system_managed,
        sort_order=role.sort_order,
        permission_count=len(role.permissions),
        assigned_member_count=assigned,
    )


def _to_detail(role: Role, assigned: int) -> RoleDetail:
    return RoleDetail(
        **_to_summary(role, assigned).model_dump(),
        permissions=sorted(grant.permission for grant in role.permissions),
    )


async def list_roles(
    session: AsyncSession, context: AuthorizationContext, *, department_id: UUID | None = None
) -> list[RoleSummary]:
    if not context.has(Permission.ADMIN_MANAGE_ROLES) and not context.has(
        Permission.ADMIN_ASSIGN_DEPARTMENTS
    ):
        raise PermissionDenied(
            message_en="You do not have access to permission sets.",
            message_zh="你没有查看权限集合的权限。",
        )

    statement = select(Role).order_by(Role.sort_order.asc(), Role.name_zh.asc())
    if department_id is not None:
        statement = statement.where(
            (Role.department_id == department_id) | (Role.department_id.is_(None))
        )

    roles = (await session.execute(statement)).unique().scalars().all()
    roles = [role for role in roles if role.key != RETIRED_OFFICER_ROLE_KEY]
    if not context.is_platform_administrator:
        roles = [role for role in roles if role.key != PLATFORM_ADMINISTRATOR_ROLE_KEY]
    counts = await _assignment_counts(session)
    return [_to_summary(role, counts.get(role.id, 0)) for role in roles]


async def get_role(
    session: AsyncSession, context: AuthorizationContext, role_id: UUID
) -> RoleDetail:
    role = await _require_role(session, role_id)
    if not context.has(Permission.ADMIN_MANAGE_ROLES):
        raise PermissionDenied(
            message_en="You do not have access to permission sets.",
            message_zh="你没有查看权限集合的权限。",
        )
    counts = await _assignment_counts(session)
    return _to_detail(role, counts.get(role.id, 0))


async def create_role(
    session: AsyncSession, context: AuthorizationContext, payload: RoleCreate
) -> RoleDetail:
    if not context.has(Permission.ADMIN_MANAGE_ROLES):
        raise PermissionDenied(
            message_en="You cannot create permission sets.",
            message_zh="你没有创建权限集合的权限。",
        )

    requested = _parse_permissions(payload.permissions)
    _assert_editor_holds(context, requested)

    role = Role(
        name_en=payload.name_en,
        name_zh=payload.name_zh,
        description_en=payload.description_en,
        description_zh=payload.description_zh,
        scope=payload.scope,
        department_id=payload.department_id,
        is_system_managed=False,
        sort_order=payload.sort_order,
    )
    session.add(role)
    await session.flush()

    for permission in requested:
        session.add(RolePermission(role_id=role.id, permission=permission.value))
    await session.flush()
    await session.refresh(role)
    return _to_detail(role, 0)


async def update_role(
    session: AsyncSession, context: AuthorizationContext, role_id: UUID, payload: RoleUpdate
) -> RoleDetail:
    if not context.has(Permission.ADMIN_MANAGE_ROLES):
        raise PermissionDenied(
            message_en="You cannot edit permission sets.",
            message_zh="你没有修改权限集合的权限。",
        )

    role = await _require_role(session, role_id)
    changes = payload.model_dump(exclude_unset=True)
    permissions = changes.pop("permissions", None)

    for field_name, value in changes.items():
        setattr(role, field_name, value)

    if permissions is not None:
        requested = _parse_permissions(permissions)
        _assert_editor_holds(context, requested)
        await session.execute(
            delete(RolePermission).where(RolePermission.role_id == role.id)
        )
        for permission in requested:
            session.add(RolePermission(role_id=role.id, permission=permission.value))

    await session.flush()
    await session.refresh(role)
    counts = await _assignment_counts(session)
    return _to_detail(role, counts.get(role.id, 0))


async def delete_role(
    session: AsyncSession, context: AuthorizationContext, role_id: UUID
) -> None:
    if not context.has(Permission.ADMIN_MANAGE_ROLES):
        raise PermissionDenied(
            message_en="You cannot delete permission sets.",
            message_zh="你没有删除权限集合的权限。",
        )

    role = await _require_role(session, role_id)
    if role.is_system_managed:
        raise ResourceConflict(
            message_en="Built-in permission sets can be edited but not deleted.",
            message_zh="内置权限集合可以修改，但不能删除。",
        )

    counts = await _assignment_counts(session)
    assigned = counts.get(role.id, 0)
    if assigned:
        raise ResourceConflict(
            message_en=f"{assigned} member(s) still hold this permission set.",
            message_zh=f"仍有 {assigned} 名成员使用该权限集合，请先改派后再删除。",
            details={"assigned_member_count": assigned},
        )

    await session.delete(role)
    await session.flush()


async def _require_role(session: AsyncSession, role_id: UUID) -> Role:
    role = (
        await session.execute(select(Role).where(Role.id == role_id))
    ).unique().scalar_one_or_none()
    if role is None:
        raise ResourceNotFound(
            message_en="That permission set could not be found.",
            message_zh="未找到该权限集合。",
        )
    return role
