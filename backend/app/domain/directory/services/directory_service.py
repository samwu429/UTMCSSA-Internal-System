"""Member roster queries, scoped to what the viewer is entitled to see.

Scoping happens in the SQL, not after the fact: a member without organization-wide visibility
never receives rows for departments they do not belong to, so pagination totals are also correct
from their point of view.

名录查询在 SQL 层完成范围收窄，而非取回后再过滤：不具备跨部门可见性的成员根本不会拿到其他部门的行，
因此分页总数从其视角看同样准确。
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config.organization.offices import (
    PLATFORM_ADMIN_DEPARTMENT_SLUG,
    PLATFORM_ADMINISTRATOR_ROLE_KEY,
)
from app.core.errors.exceptions import PermissionDenied, ResourceNotFound
from app.core.security.authorization.evaluator import AuthorizationContext
from app.core.security.authorization.permissions.catalog import Permission
from app.domain.directory.schemas.member import (
    MemberDepartmentBadge,
    MemberDetail,
    MemberPage,
    MemberProfileUpdate,
    MemberSummary,
)
from app.domain.identity.models.enums import AccountStatus, AffiliationType
from app.domain.identity.models.user_account import UserAccount
from app.domain.organization.models.department import Department
from app.domain.organization.models.membership import DepartmentMembership
from app.domain.organization.models.role import Role

MAX_PAGE_SIZE = 100


def _with_related(statement: Select) -> Select:
    return statement.options(
        selectinload(UserAccount.memberships).selectinload(DepartmentMembership.department),
        selectinload(UserAccount.memberships)
        .selectinload(DepartmentMembership.role)
        .selectinload(Role.permissions),
    )


def _visibility_filter(statement: Select, context: AuthorizationContext) -> Select:
    """Restrict rows to the departments the viewer may read."""
    visible = context.departments_allowing(Permission.DIRECTORY_VIEW_ALL_DEPARTMENTS)
    if visible is None:
        return statement

    scoped = context.departments_allowing(Permission.DIRECTORY_VIEW)
    if scoped is None:
        return statement
    if not scoped:
        raise PermissionDenied(
            message_en="You do not have access to the member directory.",
            message_zh="你没有查看成员名录的权限。",
        )

    membership_exists = (
        select(DepartmentMembership.user_id)
        .where(
            DepartmentMembership.user_id == UserAccount.id,
            DepartmentMembership.department_id.in_(scoped),
            DepartmentMembership.ended_on.is_(None),
        )
        .exists()
    )
    return statement.where(membership_exists)


def _exclude_hidden_administrator(statement: Select, context: AuthorizationContext) -> Select:
    """Keep the technical account out of every roster other members can see."""
    if context.is_platform_administrator:
        return statement
    hidden = (
        select(DepartmentMembership.user_id)
        .join(Department, Department.id == DepartmentMembership.department_id)
        .join(Role, Role.id == DepartmentMembership.role_id)
        .where(
            DepartmentMembership.user_id == UserAccount.id,
            DepartmentMembership.ended_on.is_(None),
            or_(
                Department.slug == PLATFORM_ADMIN_DEPARTMENT_SLUG,
                Role.key == PLATFORM_ADMINISTRATOR_ROLE_KEY,
            ),
        )
        .exists()
    )
    return statement.where(~hidden)


def to_summary(
    account: UserAccount, context: AuthorizationContext, *, include_contact: bool
) -> MemberSummary:
    hide_platform_admin = not context.is_platform_administrator
    badges = [
        MemberDepartmentBadge(
            membership_id=membership.id,
            department_id=membership.department_id,
            slug=membership.department.slug,
            name_zh=membership.department.name_zh,
            name_en=membership.department.name_en,
            accent_color=membership.department.accent_color,
            role_name_zh=membership.role.name_zh,
            role_name_en=membership.role.name_en,
            title_zh=membership.title_zh,
            title_en=membership.title_en,
            is_primary=membership.is_primary,
        )
        for membership in account.memberships
        if membership.is_current
        and not (
            hide_platform_admin
            and (
                membership.department.slug == PLATFORM_ADMIN_DEPARTMENT_SLUG
                or membership.role.key == PLATFORM_ADMINISTRATOR_ROLE_KEY
            )
        )
    ]
    badges.sort(key=lambda badge: (not badge.is_primary, badge.name_zh))

    return MemberSummary(
        user_id=account.id,
        display_name=account.display_name,
        legal_name=account.legal_name,
        chinese_name=account.chinese_name,
        avatar_url=account.avatar_url,
        status=account.status,
        affiliation=account.affiliation,
        graduation_year=account.graduation_year,
        program_of_study=account.program_of_study,
        departments=badges,
        email=account.email if include_contact else None,
        phone_number=account.phone_number if include_contact else None,
        wechat_id=account.wechat_id if include_contact else None,
    )


def to_detail(
    account: UserAccount, context: AuthorizationContext, *, include_contact: bool
) -> MemberDetail:
    summary = to_summary(account, context, include_contact=include_contact)
    return MemberDetail(
        **summary.model_dump(),
        biography=account.biography,
        campus=account.campus,
        enrolment_year=account.enrolment_year,
        pronouns=account.pronouns,
        created_at=account.created_at,
        last_login_at=account.last_login_at,
    )


async def list_members(
    session: AsyncSession,
    context: AuthorizationContext,
    *,
    search: str | None = None,
    department_id: UUID | None = None,
    graduation_year: int | None = None,
    affiliation: AffiliationType | None = None,
    status: AccountStatus | None = None,
    page: int = 1,
    page_size: int = 25,
) -> MemberPage:
    if not context.has(Permission.DIRECTORY_VIEW):
        raise PermissionDenied(
            message_en="You do not have access to the member directory.",
            message_zh="你没有查看成员名录的权限。",
        )

    page = max(page, 1)
    page_size = min(max(page_size, 1), MAX_PAGE_SIZE)

    statement = select(UserAccount)
    statement = _visibility_filter(statement, context)
    statement = _exclude_hidden_administrator(statement, context)
    statement = statement.where(
        UserAccount.status.in_(
            [AccountStatus.ACTIVE, AccountStatus.SUSPENDED]
            if status is None
            else [status]
        )
    )

    if department_id is not None:
        statement = statement.where(
            select(DepartmentMembership.user_id)
            .where(
                DepartmentMembership.user_id == UserAccount.id,
                DepartmentMembership.department_id == department_id,
                DepartmentMembership.ended_on.is_(None),
            )
            .exists()
        )
    if graduation_year is not None:
        statement = statement.where(UserAccount.graduation_year == graduation_year)
    if affiliation is not None:
        statement = statement.where(UserAccount.affiliation == affiliation)
    if search:
        pattern = f"%{search.strip().lower()}%"
        statement = statement.where(
            or_(
                func.lower(UserAccount.legal_name).like(pattern),
                func.lower(func.coalesce(UserAccount.chinese_name, "")).like(pattern),
                func.lower(func.coalesce(UserAccount.preferred_name, "")).like(pattern),
                func.lower(UserAccount.email).like(pattern),
                func.lower(func.coalesce(UserAccount.program_of_study, "")).like(pattern),
            )
        )

    total = (
        await session.execute(select(func.count()).select_from(statement.subquery()))
    ).scalar_one()

    rows = (
        (
            await session.execute(
                _with_related(statement)
                .order_by(UserAccount.legal_name.asc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        .unique()
        .scalars()
        .all()
    )

    include_contact = context.has(Permission.DIRECTORY_VIEW_CONTACT_DETAILS)
    return MemberPage(
        items=[to_summary(row, context, include_contact=include_contact) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


async def get_member(
    session: AsyncSession, context: AuthorizationContext, user_id: UUID
) -> MemberDetail:
    statement = _exclude_hidden_administrator(
        _visibility_filter(select(UserAccount).where(UserAccount.id == user_id), context),
        context,
    )
    account = (await session.execute(_with_related(statement))).unique().scalar_one_or_none()
    if account is None:
        raise ResourceNotFound(
            message_en="That member could not be found.",
            message_zh="未找到该成员。",
        )
    include_contact = context.has(Permission.DIRECTORY_VIEW_CONTACT_DETAILS) or (
        account.id == context.user_id
    )
    return to_detail(account, context, include_contact=include_contact)


def apply_profile_update(account: UserAccount, payload: MemberProfileUpdate) -> None:
    """Write only the fields the caller actually supplied, leaving the rest untouched."""
    for field_name, value in payload.model_dump(exclude_unset=True).items():
        setattr(account, field_name, value)
