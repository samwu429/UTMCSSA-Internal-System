"""Idempotent creation of the organization's starting structure.

Runs on every startup. Existing rows are updated in place rather than duplicated, so adding a
permission to a template in code propagates to the deployed association on the next restart
without anyone touching the database.

每次启动都会执行。已存在的行原地更新而非重复插入，因此在代码中为模板新增权限后，
下次重启即可同步到线上组织，无需任何人手动改库。
"""

from __future__ import annotations

import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config.organization.departments import (
    DEPARTMENT_BLUEPRINTS,
    DepartmentBlueprint,
)
from app.core.config.organization.offices import PLATFORM_ADMINISTRATOR_ROLE_KEY
from app.core.config.organization.role_templates import ROLE_TEMPLATES, RoleTemplate
from app.core.config.settings import get_settings
from app.core.security.passwords.hashing import hash_password
from app.domain.documents.models.category import DocumentCategory
from app.domain.documents.models.enums import DocumentKind
from app.domain.identity.models.enums import AccountStatus
from app.domain.identity.models.user_account import UserAccount
from app.domain.organization.models.department import Department
from app.domain.organization.models.membership import DepartmentMembership
from app.domain.organization.models.role import Role, RolePermission

logger = logging.getLogger(__name__)

# Filing structure every department starts with, mirroring how the association already sorts its
# paperwork into governance records and activity planning material.
# 每个部门的初始归档结构，对应社团现有的分类习惯：治理类行政文件与活动策划材料。
_DEFAULT_CATEGORY_BLUEPRINTS: tuple[tuple[str, str, str, DocumentKind], ...] = (
    ("governance", "Governance", "社团管理文件", DocumentKind.GOVERNANCE),
    ("planning", "Activity Planning", "活动策划文件", DocumentKind.PLANNING),
    ("finance", "Budgets and Reimbursement", "预算与报销", DocumentKind.FINANCE),
    ("archive", "Archive", "历史归档", DocumentKind.ARCHIVE),
)

# Child folders created beneath the planning category, which is the one that grows fastest.
# 在「活动策划文件」下创建的子目录——这是增长最快的一类。
_PLANNING_SUBCATEGORIES: tuple[tuple[str, str, str], ...] = (
    ("proposals", "Proposals", "策划方案"),
    ("run-of-show", "Run of Show", "执行流程"),
    ("post-event-review", "Post-event Review", "复盘总结"),
)


async def provision_organization(session: AsyncSession) -> None:
    """Create or refresh departments, roles, filing categories, and the bootstrap administrator."""
    roles = await _sync_roles(session)
    departments = await _sync_departments(session)
    await _sync_document_categories(session, departments)
    await _ensure_bootstrap_administrator(session, departments, roles)


async def _sync_roles(session: AsyncSession) -> dict[str, Role]:
    existing = {
        role.key: role
        for role in (await session.execute(select(Role).where(Role.key.is_not(None))))
        .scalars()
        .all()
    }

    resolved: dict[str, Role] = {}
    for template in ROLE_TEMPLATES:
        role = existing.get(template.key)
        if role is None:
            role = Role(key=template.key)
            session.add(role)
        _apply_role_template(role, template)
        resolved[template.key] = role

    await session.flush()
    for template in ROLE_TEMPLATES:
        await _sync_role_permissions(session, resolved[template.key], template)
    await session.flush()
    return resolved


def _apply_role_template(role: Role, template: RoleTemplate) -> None:
    role.name_en = template.name_en
    role.name_zh = template.name_zh
    role.description_en = template.description_en
    role.description_zh = template.description_zh
    role.scope = template.scope
    role.is_system_managed = True
    role.sort_order = template.sort_order


async def _sync_role_permissions(
    session: AsyncSession, role: Role, template: RoleTemplate
) -> None:
    desired = {permission.value for permission in template.permissions}
    current = {
        grant.permission
        for grant in (
            await session.execute(
                select(RolePermission).where(RolePermission.role_id == role.id)
            )
        )
        .scalars()
        .all()
    }

    for permission in desired - current:
        session.add(RolePermission(role_id=role.id, permission=permission))
    for permission in current - desired:
        grant = await session.get(RolePermission, (role.id, permission))
        if grant is not None:
            await session.delete(grant)


async def _sync_departments(session: AsyncSession) -> dict[str, Department]:
    existing = {
        department.slug: department
        for department in (await session.execute(select(Department))).scalars().all()
    }

    resolved: dict[str, Department] = dict(existing)
    for blueprint in DEPARTMENT_BLUEPRINTS:
        department = existing.get(blueprint.slug)
        if department is None:
            department = Department(slug=blueprint.slug)
            session.add(department)
            _apply_department_blueprint(department, blueprint)
        else:
            # Names and colours are editable in the admin console, so only fields the console does
            # not expose are refreshed from code.
            # 名称与配色可在后台修改，因此仅刷新后台未暴露的字段。
            department.has_organization_oversight = blueprint.has_organization_oversight
        resolved[blueprint.slug] = department

    await session.flush()
    return resolved


def _apply_department_blueprint(
    department: Department, blueprint: DepartmentBlueprint
) -> None:
    department.name_en = blueprint.name_en
    department.name_zh = blueprint.name_zh
    department.summary_en = blueprint.summary_en
    department.summary_zh = blueprint.summary_zh
    department.accent_color = blueprint.accent_color
    department.portal_modules = [module.value for module in blueprint.modules]
    department.has_organization_oversight = blueprint.has_organization_oversight
    department.sort_order = blueprint.sort_order
    department.is_active = True


async def _sync_document_categories(
    session: AsyncSession, departments: dict[str, Department]
) -> None:
    for department in departments.values():
        for order, (slug, name_en, name_zh, kind) in enumerate(_DEFAULT_CATEGORY_BLUEPRINTS):
            parent = await _ensure_category(
                session,
                department_id=department.id,
                parent_id=None,
                slug=slug,
                name_en=name_en,
                name_zh=name_zh,
                kind=kind,
                sort_order=order * 10,
            )
            if slug != "planning":
                continue
            for child_order, (child_slug, child_en, child_zh) in enumerate(
                _PLANNING_SUBCATEGORIES
            ):
                await _ensure_category(
                    session,
                    department_id=department.id,
                    parent_id=parent.id,
                    slug=child_slug,
                    name_en=child_en,
                    name_zh=child_zh,
                    kind=DocumentKind.PLANNING,
                    sort_order=child_order * 10,
                )
    await session.flush()


async def _ensure_category(
    session: AsyncSession,
    *,
    department_id,
    parent_id,
    slug: str,
    name_en: str,
    name_zh: str,
    kind: DocumentKind,
    sort_order: int,
) -> DocumentCategory:
    statement = select(DocumentCategory).where(
        DocumentCategory.department_id == department_id,
        DocumentCategory.slug == slug,
        DocumentCategory.parent_id.is_(parent_id) if parent_id is None
        else DocumentCategory.parent_id == parent_id,
    )
    category = (await session.execute(statement)).scalar_one_or_none()
    if category is not None:
        return category

    category = DocumentCategory(
        slug=slug,
        name_en=name_en,
        name_zh=name_zh,
        kind=kind,
        department_id=department_id,
        parent_id=parent_id,
        is_system_managed=True,
        sort_order=sort_order,
    )
    session.add(category)
    await session.flush()
    return category


async def _ensure_bootstrap_administrator(
    session: AsyncSession,
    departments: dict[str, Department],
    roles: dict[str, Role],
) -> None:
    """Create the first administrator so a fresh deployment has someone who can approve members.

    Both the address and the password must be supplied through the environment. Without them the
    step is skipped rather than defaulting to a known credential.

    地址与口令均须由环境变量提供；缺失时直接跳过，绝不退回到任何已知默认凭证。
    """
    settings = get_settings()
    if not settings.bootstrap_admin_email or not settings.bootstrap_admin_password:
        return

    email = settings.bootstrap_admin_email.strip().lower()
    existing = (
        await session.execute(select(UserAccount).where(func.lower(UserAccount.email) == email))
    ).scalar_one_or_none()
    if existing is not None:
        return

    department = departments.get("platform-admin")
    role = roles.get(PLATFORM_ADMINISTRATOR_ROLE_KEY)
    if department is None or role is None:
        logger.warning("Bootstrap administrator skipped: platform administration seed missing.")
        return

    account = UserAccount(
        email=email,
        password_hash=hash_password(settings.bootstrap_admin_password),
        legal_name="Platform Administrator",
        chinese_name="平台管理员",
        status=AccountStatus.ACTIVE,
    )
    session.add(account)
    await session.flush()

    session.add(
        DepartmentMembership(
            user_id=account.id,
            department_id=department.id,
            role_id=role.id,
            is_primary=True,
            title_en="Platform Administrator",
            title_zh="平台管理员",
        )
    )
    await session.flush()
    logger.info("Bootstrap administrator provisioned for %s", email)
