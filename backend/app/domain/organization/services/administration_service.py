"""The approval queue and account lifecycle operations the presidium performs.

Approving an applicant is one transaction that does three things: it activates the account, it
creates the department membership that decides which portal they land on, and it emails them the
result. Splitting those apart would leave an active account with nowhere to go.

主席团执行的审批与账号生命周期操作。通过一名申请人是一个事务内的三件事：
激活账号、创建决定其落地门户的部门归属、以及邮件告知结果。
若拆开执行，会出现「账号已激活但无处可去」的状态。
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config.settings import get_settings
from app.core.errors.exceptions import PermissionDenied, ResourceConflict, ResourceNotFound
from app.core.security.authorization.evaluator import AuthorizationContext
from app.core.security.authorization.permissions.catalog import Permission
from app.domain.activities.models.activity import Activity, ActivityStatus
from app.domain.audit.models.audit_log_entry import AuditAction, AuditLogEntry
from app.domain.audit.services import audit_service
from app.domain.documents.models.document import Document
from app.domain.identity.models.enums import AccountStatus, AffiliationType
from app.domain.identity.models.user_account import UserAccount
from app.domain.notifications.models.email_delivery_log import EmailTemplateKey
from app.domain.organization.models.department import Department
from app.domain.organization.models.membership import DepartmentMembership
from app.domain.organization.models.role import Role
from app.domain.organization.schemas.administration import (
    AccountStatusChange,
    AdministrationActionResult,
    AuditEntryPage,
    AuditEntryView,
    OversightSnapshot,
    PendingRegistration,
    RegistrationApproval,
    RegistrationRejection,
)
from app.domain.organization.schemas.role import MembershipAssignment
from app.domain.organization.services import membership_service
from app.infrastructure.email.dispatcher import EmailDispatcher
from app.infrastructure.email.templates import account_lifecycle


async def list_pending_registrations(
    session: AsyncSession, context: AuthorizationContext
) -> list[PendingRegistration]:
    if not context.has(Permission.ADMIN_REVIEW_REGISTRATIONS):
        raise PermissionDenied(
            message_en="You cannot review registration requests.",
            message_zh="你没有审批注册申请的权限。",
        )

    statement = (
        select(UserAccount)
        .where(
            UserAccount.status == AccountStatus.PENDING_APPROVAL,
            UserAccount.email_verified_at.is_not(None),
        )
        .order_by(UserAccount.created_at.asc())
    )
    accounts = (await session.execute(statement)).unique().scalars().all()

    return [
        PendingRegistration(
            user_id=account.id,
            email=account.email,
            legal_name=account.legal_name,
            chinese_name=account.chinese_name,
            preferred_name=account.preferred_name,
            affiliation=account.affiliation,
            graduation_year=account.graduation_year,
            enrolment_year=account.enrolment_year,
            program_of_study=account.program_of_study,
            phone_number=account.phone_number,
            requested_department_slug=account.requested_department_slug,
            email_verified_at=account.email_verified_at,
            registered_at=account.created_at,
        )
        for account in accounts
    ]


async def approve_registration(
    session: AsyncSession,
    context: AuthorizationContext,
    *,
    user_id: UUID,
    payload: RegistrationApproval,
    dispatcher: EmailDispatcher,
) -> AdministrationActionResult:
    if not context.has(Permission.ADMIN_REVIEW_REGISTRATIONS):
        raise PermissionDenied(
            message_en="You cannot review registration requests.",
            message_zh="你没有审批注册申请的权限。",
        )
    membership_service.assert_may_assign(context, payload.department_id)

    account = await _require_account(session, user_id)
    if account.status not in {AccountStatus.PENDING_APPROVAL, AccountStatus.REJECTED}:
        raise ResourceConflict(
            message_en="This account is not waiting for approval.",
            message_zh="该账号当前不处于待审批状态。",
        )

    department = await session.get(Department, payload.department_id)
    role = await session.get(Role, payload.role_id)
    if department is None or role is None:
        raise ResourceNotFound(
            message_en="The department or permission set could not be found.",
            message_zh="未找到对应的部门或权限集合。",
        )

    await membership_service.assign(
        session,
        context,
        MembershipAssignment(
            user_id=account.id,
            department_id=department.id,
            role_id=role.id,
            is_primary=True,
            title_en=payload.title_en,
            title_zh=payload.title_zh,
            term_label=payload.term_label,
        ),
    )

    account.status = AccountStatus.ACTIVE
    account.approved_at = datetime.now(UTC)
    account.approved_by_id = context.user_id
    await session.flush()

    settings = get_settings()
    subject, html_body, text_body = account_lifecycle.registration_approved(
        recipient_name=account.display_name,
        department_name_zh=department.name_zh,
        department_name_en=department.name_en,
        role_name_zh=role.name_zh,
        portal_url=f"{settings.frontend_base_url.rstrip('/')}{department.portal_path}",
        welcome_note=payload.welcome_note,
    )
    await dispatcher.send(
        session,
        recipient_email=account.email,
        template_key=EmailTemplateKey.REGISTRATION_APPROVED,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        recipient_id=account.id,
    )

    await audit_service.record(
        session,
        action=AuditAction.REGISTRATION_APPROVED,
        actor_id=context.user_id,
        target_type="user_account",
        target_id=account.id,
        department_id=department.id,
        summary=f"通过了 {account.display_name} 的注册申请，归入{department.name_zh}。",
    )

    return AdministrationActionResult(
        user_id=account.id,
        status=account.status,
        message_en=f"{account.display_name} was added to {department.name_en}.",
        message_zh=f"已通过 {account.display_name} 的申请，归入{department.name_zh}。",
    )


async def reject_registration(
    session: AsyncSession,
    context: AuthorizationContext,
    *,
    user_id: UUID,
    payload: RegistrationRejection,
    dispatcher: EmailDispatcher,
) -> AdministrationActionResult:
    if not context.has(Permission.ADMIN_REVIEW_REGISTRATIONS):
        raise PermissionDenied(
            message_en="You cannot review registration requests.",
            message_zh="你没有审批注册申请的权限。",
        )

    account = await _require_account(session, user_id)
    account.status = AccountStatus.REJECTED
    await session.flush()

    subject, html_body, text_body = account_lifecycle.registration_rejected(
        recipient_name=account.display_name,
        reason_zh=payload.reason_zh,
        reason_en=payload.reason_en,
    )
    await dispatcher.send(
        session,
        recipient_email=account.email,
        template_key=EmailTemplateKey.REGISTRATION_REJECTED,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        recipient_id=account.id,
    )

    await audit_service.record(
        session,
        action=AuditAction.REGISTRATION_REJECTED,
        actor_id=context.user_id,
        target_type="user_account",
        target_id=account.id,
        summary=f"驳回了 {account.display_name} 的注册申请。",
        context={"reason": payload.reason_zh},
    )

    return AdministrationActionResult(
        user_id=account.id,
        status=account.status,
        message_en=f"{account.display_name}'s registration was declined.",
        message_zh=f"已驳回 {account.display_name} 的注册申请。",
    )


async def change_account_status(
    session: AsyncSession,
    context: AuthorizationContext,
    *,
    user_id: UUID,
    payload: AccountStatusChange,
) -> AdministrationActionResult:
    if not context.has(Permission.ADMIN_DEACTIVATE_ACCOUNTS):
        raise PermissionDenied(
            message_en="You cannot change account status.",
            message_zh="你没有变更账号状态的权限。",
        )
    if user_id == context.user_id:
        raise ResourceConflict(
            message_en="You cannot change the status of your own account.",
            message_zh="不能变更自己账号的状态。",
        )

    account = await _require_account(session, user_id)
    account.status = payload.status
    await session.flush()

    action = (
        AuditAction.ACCOUNT_SUSPENDED
        if payload.status is AccountStatus.SUSPENDED
        else AuditAction.ACCOUNT_REACTIVATED
    )
    await audit_service.record(
        session,
        action=action,
        actor_id=context.user_id,
        target_type="user_account",
        target_id=account.id,
        summary=f"将 {account.display_name} 的账号状态设为「{payload.status.value}」。",
        context={"reason": payload.reason} if payload.reason else {},
    )

    return AdministrationActionResult(
        user_id=account.id,
        status=account.status,
        message_en=f"{account.display_name}'s account is now {payload.status.value}.",
        message_zh=f"{account.display_name} 的账号状态已更新。",
    )


async def build_overview(
    session: AsyncSession, context: AuthorizationContext
) -> OversightSnapshot:
    if not context.has_organization_reach:
        raise PermissionDenied(
            message_en="You do not have organization-wide oversight.",
            message_zh="你没有跨部门监管权限。",
        )

    async def count_accounts(*conditions) -> int:
        statement = select(func.count()).select_from(UserAccount).where(*conditions)
        return (await session.execute(statement)).scalar_one()

    upcoming = (
        await session.execute(
            select(func.count())
            .select_from(Activity)
            .where(
                Activity.status == ActivityStatus.PUBLISHED,
                Activity.starts_at >= datetime.now(UTC),
            )
        )
    ).scalar_one()

    return OversightSnapshot(
        total_active_members=await count_accounts(
            UserAccount.status == AccountStatus.ACTIVE,
            UserAccount.affiliation == AffiliationType.STUDENT,
        ),
        total_alumni=await count_accounts(
            UserAccount.affiliation == AffiliationType.ALUMNUS,
        ),
        pending_registrations=await count_accounts(
            UserAccount.status == AccountStatus.PENDING_APPROVAL,
        ),
        suspended_accounts=await count_accounts(
            UserAccount.status == AccountStatus.SUSPENDED,
        ),
        departments=(
            await session.execute(
                select(func.count()).select_from(Department).where(Department.is_active.is_(True))
            )
        ).scalar_one(),
        documents=(
            await session.execute(
                select(func.count()).select_from(Document).where(Document.archived_at.is_(None))
            )
        ).scalar_one(),
        upcoming_activities=upcoming,
    )


async def list_audit_entries(
    session: AsyncSession,
    context: AuthorizationContext,
    *,
    page: int = 1,
    page_size: int = 30,
) -> AuditEntryPage:
    if not context.has(Permission.ADMIN_VIEW_AUDIT_LOG):
        raise PermissionDenied(
            message_en="You cannot view the audit log.",
            message_zh="你没有查看操作记录的权限。",
        )

    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)

    total = (
        await session.execute(select(func.count()).select_from(AuditLogEntry))
    ).scalar_one()

    rows = await session.execute(
        select(AuditLogEntry, UserAccount.legal_name)
        .outerjoin(UserAccount, UserAccount.id == AuditLogEntry.actor_id)
        .order_by(AuditLogEntry.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    items = [
        AuditEntryView(
            id=entry.id,
            action=entry.action,
            actor_id=entry.actor_id,
            actor_name=actor_name,
            target_type=entry.target_type,
            target_id=entry.target_id,
            department_id=entry.department_id,
            summary=entry.summary,
            created_at=entry.created_at,
        )
        for entry, actor_name in rows.all()
    ]
    return AuditEntryPage(items=items, total=total, page=page, page_size=page_size)


async def _require_account(session: AsyncSession, user_id: UUID) -> UserAccount:
    statement = (
        select(UserAccount)
        .where(UserAccount.id == user_id)
        .options(selectinload(UserAccount.memberships).selectinload(DepartmentMembership.department))
    )
    account = (await session.execute(statement)).unique().scalar_one_or_none()
    if account is None:
        raise ResourceNotFound(
            message_en="That account could not be found.",
            message_zh="未找到该账号。",
        )
    return account
