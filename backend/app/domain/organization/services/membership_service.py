"""Placing accounts into departments.

Marking a membership primary demotes the previous primary in the same transaction, because the
landing-path calculation assumes at most one. Every change is written to the audit trail.

将某条成员关系标记为主归属时，会在同一事务内取消原主归属：落地路径的计算假定至多存在一条。
所有变更均写入操作轨迹。
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config.organization.appointment_rules import (
    MEMBER_ADMISSION_OFFICE,
    can_appoint_office,
    can_release_office,
)
from app.core.errors.exceptions import PermissionDenied, ResourceConflict, ResourceNotFound
from app.core.security.authorization.evaluator import AuthorizationContext
from app.core.security.authorization.permissions.catalog import Permission
from app.domain.audit.models.audit_log_entry import AuditAction
from app.domain.audit.services import audit_service
from app.domain.identity.schemas.session_profile import MembershipSummary
from app.domain.organization.models.department import Department
from app.domain.organization.models.membership import DepartmentMembership
from app.domain.organization.models.role import Role
from app.domain.organization.schemas.role import MembershipAssignment, MembershipUpdate


def to_summary(membership: DepartmentMembership) -> MembershipSummary:
    return MembershipSummary(
        membership_id=membership.id,
        department_id=membership.department_id,
        department_slug=membership.department.slug,
        department_name_en=membership.department.name_en,
        department_name_zh=membership.department.name_zh,
        department_accent_color=membership.department.accent_color,
        role_id=membership.role_id,
        role_key=membership.role.key,
        role_name_en=membership.role.name_en,
        role_name_zh=membership.role.name_zh,
        role_scope=membership.role.scope,
        title_en=membership.title_en,
        title_zh=membership.title_zh,
        term_label=membership.term_label,
        is_primary=membership.is_primary,
    )


def assert_may_assign(context: AuthorizationContext, department_id: UUID) -> None:
    if not context.has(Permission.ADMIN_ASSIGN_DEPARTMENTS, department_id=department_id):
        raise PermissionDenied(
            message_en="You cannot change department placement for this department.",
            message_zh="你没有调整该部门归属的权限。",
        )


async def assign(
    session: AsyncSession,
    context: AuthorizationContext,
    payload: MembershipAssignment,
) -> MembershipSummary:
    from app.domain.organization.services import appointment_service

    department = await session.get(Department, payload.department_id)
    role = await session.get(Role, payload.role_id)
    if department is None or role is None:
        raise ResourceNotFound(
            message_en="The department or permission set could not be found.",
            message_zh="未找到对应的部门或权限集合。",
        )
    appointment_service.assert_may_place(
        context,
        department_id=department.id,
        department_slug=department.slug,
        office_key=role.key,
    )
    if role.department_id is not None and role.department_id != department.id:
        raise ResourceConflict(
            message_en="That permission set belongs to a different department.",
            message_zh="该权限集合属于其他部门，无法在此使用。",
        )
    await appointment_service.enforce_seat_capacity(
        session,
        department_id=department.id,
        role=role,
        incoming_user_id=payload.user_id,
    )

    existing = (
        await session.execute(
            select(DepartmentMembership).where(
                DepartmentMembership.user_id == payload.user_id,
                DepartmentMembership.department_id == payload.department_id,
            )
        )
    ).scalar_one_or_none()

    if existing is not None:
        existing.role_id = role.id
        existing.title_en = payload.title_en
        existing.title_zh = payload.title_zh
        existing.term_label = payload.term_label
        existing.ended_on = None
        membership = existing
        action = AuditAction.MEMBERSHIP_ROLE_CHANGED
    else:
        membership = DepartmentMembership(
            user_id=payload.user_id,
            department_id=payload.department_id,
            role_id=role.id,
            title_en=payload.title_en,
            title_zh=payload.title_zh,
            term_label=payload.term_label,
            is_primary=False,
        )
        session.add(membership)
        action = AuditAction.MEMBERSHIP_GRANTED

    await session.flush()

    if payload.is_primary or not await _has_primary(session, payload.user_id):
        await _set_primary(session, payload.user_id, membership.id)

    await audit_service.record(
        session,
        action=action,
        actor_id=context.user_id,
        target_type="user_account",
        target_id=payload.user_id,
        department_id=department.id,
        summary=f"将成员归入{department.name_zh}，权限集合为「{role.name_zh}」。",
        context={"role_id": str(role.id), "department_slug": department.slug},
    )

    return to_summary(await _require_loaded(session, membership.id))


async def modify(
    session: AsyncSession,
    context: AuthorizationContext,
    membership_id: UUID,
    payload: MembershipUpdate,
) -> MembershipSummary:
    membership = await _require_loaded(session, membership_id)
    assert_may_assign(context, membership.department_id)

    changes = payload.model_dump(exclude_unset=True)
    make_primary = changes.pop("is_primary", None)

    if "role_id" in changes and changes["role_id"] is not None:
        role = await session.get(Role, changes["role_id"])
        if role is None:
            raise ResourceNotFound(
                message_en="That permission set could not be found.",
                message_zh="未找到该权限集合。",
            )
        if role.key == MEMBER_ADMISSION_OFFICE:
            current_key = membership.role.key
            if current_key is None or not can_release_office(
                context,
                department_id=membership.department_id,
                department_slug=membership.department.slug,
                office_key=current_key,
                holder_user_id=membership.user_id,
            ):
                raise PermissionDenied(
                    message_en="You cannot step this person down from that office.",
                    message_zh="你不能卸任该职务。",
                )
        else:
            from app.domain.organization.services import appointment_service

            appointment_service.assert_may_place(
                context,
                department_id=membership.department_id,
                department_slug=membership.department.slug,
                office_key=role.key,
            )
            await appointment_service.enforce_seat_capacity(
                session,
                department_id=membership.department_id,
                role=role,
                incoming_user_id=membership.user_id,
            )

    for field_name, value in changes.items():
        setattr(membership, field_name, value)
    await session.flush()

    if make_primary:
        await _set_primary(session, membership.user_id, membership.id)
        await audit_service.record(
            session,
            action=AuditAction.PRIMARY_DEPARTMENT_CHANGED,
            actor_id=context.user_id,
            target_type="user_account",
            target_id=membership.user_id,
            department_id=membership.department_id,
            summary=f"将成员的主归属部门设为{membership.department.name_zh}。",
        )

    return to_summary(await _require_loaded(session, membership_id))


async def revoke(
    session: AsyncSession, context: AuthorizationContext, membership_id: UUID
) -> None:
    membership = await _require_loaded(session, membership_id)
    assert_may_assign(context, membership.department_id)
    office_key = membership.role.key
    if office_key and office_key != MEMBER_ADMISSION_OFFICE:
        if not can_release_office(
            context,
            department_id=membership.department_id,
            department_slug=membership.department.slug,
            office_key=office_key,
            holder_user_id=membership.user_id,
        ):
            raise PermissionDenied(
                message_en="You cannot remove that office.",
                message_zh="你不能移除该职务。",
            )
    elif not can_appoint_office(
        context,
        department_id=membership.department_id,
        department_slug=membership.department.slug,
        office_key=MEMBER_ADMISSION_OFFICE,
    ):
        raise PermissionDenied(
            message_en="You cannot remove this member from the department.",
            message_zh="你不能将该成员移出部门。",
        )

    department_name = membership.department.name_zh
    user_id = membership.user_id
    was_primary = membership.is_primary

    await session.delete(membership)
    await session.flush()

    if was_primary:
        remaining = (
            await session.execute(
                select(DepartmentMembership)
                .where(DepartmentMembership.user_id == user_id)
                .order_by(DepartmentMembership.created_at.asc())
                .limit(1)
            )
        ).scalar_one_or_none()
        if remaining is not None:
            await _set_primary(session, user_id, remaining.id)

    await audit_service.record(
        session,
        action=AuditAction.MEMBERSHIP_REVOKED,
        actor_id=context.user_id,
        target_type="user_account",
        target_id=user_id,
        summary=f"移除了成员在{department_name}的归属。",
    )


async def _has_primary(session: AsyncSession, user_id: UUID) -> bool:
    statement = select(DepartmentMembership.id).where(
        DepartmentMembership.user_id == user_id,
        DepartmentMembership.is_primary.is_(True),
    )
    return (await session.execute(statement.limit(1))).scalar_one_or_none() is not None


async def _set_primary(session: AsyncSession, user_id: UUID, membership_id: UUID) -> None:
    await session.execute(
        update(DepartmentMembership)
        .where(DepartmentMembership.user_id == user_id)
        .values(is_primary=False)
    )
    await session.execute(
        update(DepartmentMembership)
        .where(DepartmentMembership.id == membership_id)
        .values(is_primary=True)
    )
    await session.flush()


async def _require_loaded(
    session: AsyncSession, membership_id: UUID
) -> DepartmentMembership:
    statement = (
        select(DepartmentMembership)
        .where(DepartmentMembership.id == membership_id)
        .options(
            selectinload(DepartmentMembership.department),
            selectinload(DepartmentMembership.role),
        )
    )
    membership = (await session.execute(statement)).unique().scalar_one_or_none()
    if membership is None:
        raise ResourceNotFound(
            message_en="That department placement could not be found.",
            message_zh="未找到该部门归属记录。",
        )
    return membership
