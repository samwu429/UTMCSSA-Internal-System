"""Appointing officers into named seats, with the association's succession rules.

The president fills director seats and the four presidium offices. A director fills up to two
deputy seats in their own department. Unique seats transfer: the previous holder stays in the
department as a member.

主席任命各部门部长与主席团四席；部长在本部门任命至多两名副部长。
独任席位在继任时移交，原任职者留在该部门改任部员。
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config.organization.appointment_rules import (
    MEMBER_ADMISSION_OFFICE,
    UNIQUE_OFFICES,
    appointable_offices_for_department,
    can_appoint_office,
    can_release_office,
    seat_limit_for,
)
from app.core.errors.exceptions import PermissionDenied, ResourceConflict, ResourceNotFound
from app.core.security.authorization.evaluator import AuthorizationContext
from app.core.security.authorization.permissions.catalog import Permission
from app.domain.identity.models.enums import AccountStatus
from app.domain.identity.models.user_account import UserAccount
from app.domain.identity.schemas.session_profile import MembershipSummary
from app.domain.organization.models.department import Department
from app.domain.organization.models.membership import DepartmentMembership
from app.domain.organization.models.role import Role
from app.domain.organization.schemas.appointment import (
    DepartmentOfficeBoard,
    OfficeAppointment,
    OfficeBoard,
    OfficeHolderView,
    OfficeSeatView,
)
from app.domain.organization.schemas.role import MembershipAssignment
from app.domain.organization.services import membership_service


async def list_office_board(session: AsyncSession, context: AuthorizationContext) -> OfficeBoard:
    if not context.has(Permission.ADMIN_ASSIGN_DEPARTMENTS):
        raise PermissionDenied(
            message_en="You cannot appoint officers.",
            message_zh="你没有任命职务的权限。",
        )

    departments = (
        (
            await session.execute(
                select(Department)
                .where(Department.is_active.is_(True))
                .order_by(Department.sort_order.asc(), Department.name_zh.asc())
            )
        )
        .scalars()
        .all()
    )

    boards: list[DepartmentOfficeBoard] = []
    for department in departments:
        offices = appointable_offices_for_department(
            context,
            department_id=department.id,
            department_slug=department.slug,
        )
        if not offices:
            continue
        seats: list[OfficeSeatView] = []
        for office_key in offices:
            role = await _require_role_by_key(session, office_key)
            holders = await _holders_for(session, department.id, role.id)
            limit = seat_limit_for(office_key) or 0
            seats.append(
                OfficeSeatView(
                    office_key=office_key,
                    office_name_zh=role.name_zh,
                    office_name_en=role.name_en,
                    seat_limit=limit,
                    holders=[
                        OfficeHolderView(
                            user_id=membership.user_id,
                            display_name=membership.user.display_name,
                            membership_id=membership.id,
                        )
                        for membership in holders
                    ],
                    can_appoint=can_appoint_office(
                        context,
                        department_id=department.id,
                        department_slug=department.slug,
                        office_key=office_key,
                    ),
                    can_release=any(
                        can_release_office(
                            context,
                            department_id=department.id,
                            department_slug=department.slug,
                            office_key=office_key,
                            holder_user_id=membership.user_id,
                        )
                        for membership in holders
                    ),
                )
            )
        boards.append(
            DepartmentOfficeBoard(
                department_id=department.id,
                department_slug=department.slug,
                department_name_zh=department.name_zh,
                department_name_en=department.name_en,
                offices=seats,
            )
        )
    return OfficeBoard(departments=boards)


async def appoint(
    session: AsyncSession,
    context: AuthorizationContext,
    payload: OfficeAppointment,
) -> MembershipSummary:
    department = await session.get(Department, payload.department_id)
    if department is None:
        raise ResourceNotFound(
            message_en="That department could not be found.",
            message_zh="未找到该部门。",
        )
    role = await _require_role_by_key(session, payload.office_key)
    account = await session.get(UserAccount, payload.user_id)
    if account is None or account.status is not AccountStatus.ACTIVE:
        raise ResourceConflict(
            message_en="Only an active member can be appointed to an office.",
            message_zh="只能任命已通过审批的在册成员。",
        )

    return await membership_service.assign(
        session,
        context,
        MembershipAssignment(
            user_id=payload.user_id,
            department_id=department.id,
            role_id=role.id,
            is_primary=True,
            title_zh=role.name_zh,
            title_en=role.name_en,
            term_label=payload.term_label,
        ),
    )


async def release(
    session: AsyncSession,
    context: AuthorizationContext,
    membership_id: UUID,
) -> MembershipSummary:
    membership = (
        await session.execute(
            select(DepartmentMembership)
            .where(DepartmentMembership.id == membership_id)
            .options(
                selectinload(DepartmentMembership.department),
                selectinload(DepartmentMembership.role),
            )
        )
    ).unique().scalar_one_or_none()
    if membership is None:
        raise ResourceNotFound(
            message_en="That office placement could not be found.",
            message_zh="未找到该任职记录。",
        )
    office_key = membership.role.key
    if office_key is None or not can_release_office(
        context,
        department_id=membership.department_id,
        department_slug=membership.department.slug,
        office_key=office_key,
        holder_user_id=membership.user_id,
    ):
        raise PermissionDenied(
            message_en="You cannot step this person down from that office.",
            message_zh="你不能卸任该职务。",
        )

    member_role = await _require_role_by_key(session, MEMBER_ADMISSION_OFFICE)
    from app.domain.organization.schemas.role import MembershipUpdate

    return await membership_service.modify(
        session,
        context,
        membership_id,
        MembershipUpdate(role_id=member_role.id, title_zh=member_role.name_zh, title_en=member_role.name_en),
    )


def assert_may_place(
    context: AuthorizationContext,
    *,
    department_id: UUID,
    department_slug: str,
    office_key: str | None,
) -> None:
    if office_key is None:
        raise PermissionDenied(
            message_en="That permission set cannot be appointed as an office.",
            message_zh="该权限集合不能作为职务任命。",
        )
    if not context.has(Permission.ADMIN_ASSIGN_DEPARTMENTS, department_id=department_id):
        raise PermissionDenied(
            message_en="You cannot change department placement for this department.",
            message_zh="你没有调整该部门归属的权限。",
        )
    if not can_appoint_office(
        context,
        department_id=department_id,
        department_slug=department_slug,
        office_key=office_key,
    ):
        raise PermissionDenied(
            message_en="Your office cannot appoint someone to that seat.",
            message_zh="你的职务不能任命该席位。",
        )


async def enforce_seat_capacity(
    session: AsyncSession,
    *,
    department_id: UUID,
    role: Role,
    incoming_user_id: UUID,
) -> None:
    """Reject a third deputy; transfer a unique seat by demoting the previous holder."""
    office_key = role.key
    if office_key is None:
        return
    limit = seat_limit_for(office_key)
    if limit is None:
        return

    holders = await _holders_for(session, department_id, role.id)
    already = [membership for membership in holders if membership.user_id == incoming_user_id]
    others = [membership for membership in holders if membership.user_id != incoming_user_id]
    if already:
        return
    if len(others) < limit:
        return
    if office_key in UNIQUE_OFFICES:
        member_role = await _require_role_by_key(session, MEMBER_ADMISSION_OFFICE)
        for previous in others:
            previous.role_id = member_role.id
            previous.title_zh = member_role.name_zh
            previous.title_en = member_role.name_en
        await session.flush()
        return
    raise ResourceConflict(
        message_en=f"This office already has {limit} occupants.",
        message_zh=f"该职务已有{limit}人，请先卸任后再任命。",
        details={"office_key": office_key, "seat_limit": limit},
    )


async def _holders_for(
    session: AsyncSession, department_id: UUID, role_id: UUID
) -> list[DepartmentMembership]:
    statement = (
        select(DepartmentMembership)
        .where(
            DepartmentMembership.department_id == department_id,
            DepartmentMembership.role_id == role_id,
            DepartmentMembership.ended_on.is_(None),
        )
        .options(selectinload(DepartmentMembership.user))
        .order_by(DepartmentMembership.created_at.asc())
    )
    return list((await session.execute(statement)).unique().scalars().all())


async def _require_role_by_key(session: AsyncSession, key: str) -> Role:
    role = (
        await session.execute(select(Role).where(Role.key == key))
    ).scalar_one_or_none()
    if role is None:
        raise ResourceNotFound(
            message_en="That office could not be found.",
            message_zh="未找到该职务对应的权限集合。",
        )
    return role
