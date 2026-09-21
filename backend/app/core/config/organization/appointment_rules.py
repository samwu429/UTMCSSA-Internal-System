"""Who may place whom into which office.

These rules sit on top of permission checks. Holding ``admin.assign_departments`` is not enough to
make someone president; the actor must occupy the office that the association entrusted with that
appointment.

任职规则叠在权限判断之上。仅持有「调整部门归属」并不足以把人设为主席；
操作者必须本人担任社团托付的那个职位。
"""

from __future__ import annotations

from uuid import UUID

from app.core.config.organization.offices import (
    DEPARTMENT_DEPUTY_ROLE_KEY,
    DEPARTMENT_DIRECTOR_ROLE_KEY,
    DEPARTMENT_MEMBER_ROLE_KEY,
    PLATFORM_ADMIN_DEPARTMENT_SLUG,
    PRESIDIUM_DEPARTMENT_SLUG,
    PRESIDIUM_EXTERNAL_VP_ROLE_KEY,
    PRESIDIUM_INTERNAL_VP_ROLE_KEY,
    PRESIDIUM_PRESIDENT_ROLE_KEY,
    PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY,
)
from app.core.security.authorization.evaluator import AuthorizationContext

ALUMNI_DEPARTMENT_SLUG = "alumni"

PRESIDENT_APPOINTABLE_OFFICES: frozenset[str] = frozenset(
    {
        DEPARTMENT_DIRECTOR_ROLE_KEY,
        PRESIDIUM_PRESIDENT_ROLE_KEY,
        PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY,
        PRESIDIUM_INTERNAL_VP_ROLE_KEY,
        PRESIDIUM_EXTERNAL_VP_ROLE_KEY,
    }
)

DIRECTOR_APPOINTABLE_OFFICES: frozenset[str] = frozenset({DEPARTMENT_DEPUTY_ROLE_KEY})

MEMBER_ADMISSION_OFFICE = DEPARTMENT_MEMBER_ROLE_KEY

OFFICE_SEAT_LIMITS: dict[str, int] = {
    DEPARTMENT_DIRECTOR_ROLE_KEY: 1,
    DEPARTMENT_DEPUTY_ROLE_KEY: 2,
    PRESIDIUM_PRESIDENT_ROLE_KEY: 1,
    PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY: 1,
    PRESIDIUM_INTERNAL_VP_ROLE_KEY: 1,
    PRESIDIUM_EXTERNAL_VP_ROLE_KEY: 1,
}

UNIQUE_OFFICES: frozenset[str] = frozenset(
    office for office, limit in OFFICE_SEAT_LIMITS.items() if limit == 1
)


def seat_limit_for(office_key: str) -> int | None:
    """How many people may hold this office in one department; ``None`` means no cap."""
    return OFFICE_SEAT_LIMITS.get(office_key)


def is_president(context: AuthorizationContext) -> bool:
    return any(
        membership.role_key == PRESIDIUM_PRESIDENT_ROLE_KEY for membership in context.memberships
    )


def is_director_of(context: AuthorizationContext, department_id: UUID) -> bool:
    return any(
        membership.role_key == DEPARTMENT_DIRECTOR_ROLE_KEY
        and membership.department_id == department_id
        for membership in context.memberships
    )


def is_deputy_of(context: AuthorizationContext, department_id: UUID) -> bool:
    return any(
        membership.role_key == DEPARTMENT_DEPUTY_ROLE_KEY
        and membership.department_id == department_id
        for membership in context.memberships
    )


def reviewable_department_slugs(context: AuthorizationContext) -> frozenset[str] | None:
    """Department slugs whose registration queue this account may see.

    ``None`` means the hidden administrator may see every application.

    返回该账号可查看注册队列的部门标识；``None`` 表示隐藏管理员可看全部申请。
    """
    if context.is_platform_administrator:
        return None
    slugs: set[str] = set()
    for membership in context.memberships:
        if membership.role_key in {DEPARTMENT_DIRECTOR_ROLE_KEY, DEPARTMENT_DEPUTY_ROLE_KEY}:
            slugs.add(membership.department_slug)
        if membership.role_key == PRESIDIUM_PRESIDENT_ROLE_KEY:
            slugs.add(PRESIDIUM_DEPARTMENT_SLUG)
    return frozenset(slugs)


def can_review_department(
    context: AuthorizationContext,
    *,
    department_id: UUID,
    department_slug: str,
) -> bool:
    if context.is_platform_administrator:
        return True
    if is_president(context) and department_slug == PRESIDIUM_DEPARTMENT_SLUG:
        return True
    return is_director_of(context, department_id) or is_deputy_of(context, department_id)


def can_appoint_office(
    context: AuthorizationContext,
    *,
    department_id: UUID,
    department_slug: str,
    office_key: str,
) -> bool:
    """Whether this account may place someone into ``office_key`` in that department."""
    if context.is_platform_administrator:
        return True
    if department_slug in {PLATFORM_ADMIN_DEPARTMENT_SLUG, ALUMNI_DEPARTMENT_SLUG}:
        return False
    if office_key == DEPARTMENT_DIRECTOR_ROLE_KEY:
        return is_president(context) and department_slug != PRESIDIUM_DEPARTMENT_SLUG
    if office_key in {
        PRESIDIUM_PRESIDENT_ROLE_KEY,
        PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY,
        PRESIDIUM_INTERNAL_VP_ROLE_KEY,
        PRESIDIUM_EXTERNAL_VP_ROLE_KEY,
    }:
        return is_president(context) and department_slug == PRESIDIUM_DEPARTMENT_SLUG
    if office_key == DEPARTMENT_DEPUTY_ROLE_KEY:
        return is_director_of(context, department_id)
    if office_key == MEMBER_ADMISSION_OFFICE:
        return can_review_department(
            context, department_id=department_id, department_slug=department_slug
        )
    return False


def can_release_office(
    context: AuthorizationContext,
    *,
    department_id: UUID,
    department_slug: str,
    office_key: str,
    holder_user_id: UUID,
) -> bool:
    """Whether this account may step someone down from ``office_key``.

    The sitting president cannot vacate their own seat here; they appoint the next president.
    现任主席不能在此卸任自己；应任命下一任主席。
    """
    if (
        office_key == PRESIDIUM_PRESIDENT_ROLE_KEY
        and holder_user_id == context.user_id
        and not context.is_platform_administrator
    ):
        return False
    return can_appoint_office(
        context,
        department_id=department_id,
        department_slug=department_slug,
        office_key=office_key,
    )


def appointable_offices_for_department(
    context: AuthorizationContext,
    *,
    department_id: UUID,
    department_slug: str,
) -> tuple[str, ...]:
    """Offices this account may fill in one department, in the order they should appear."""
    if department_slug == PLATFORM_ADMIN_DEPARTMENT_SLUG:
        return ()
    if department_slug == PRESIDIUM_DEPARTMENT_SLUG:
        candidates = (
            PRESIDIUM_PRESIDENT_ROLE_KEY,
            PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY,
            PRESIDIUM_INTERNAL_VP_ROLE_KEY,
            PRESIDIUM_EXTERNAL_VP_ROLE_KEY,
        )
    elif department_slug == ALUMNI_DEPARTMENT_SLUG:
        return ()
    else:
        candidates = (DEPARTMENT_DIRECTOR_ROLE_KEY, DEPARTMENT_DEPUTY_ROLE_KEY)
    return tuple(
        office
        for office in candidates
        if can_appoint_office(
            context,
            department_id=department_id,
            department_slug=department_slug,
            office_key=office,
        )
    )
