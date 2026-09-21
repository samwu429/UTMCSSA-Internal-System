"""Manual emails sent to a department roster or to the whole association.

Preview mode resolves the recipient list without sending, because the difference between mailing
one department and mailing four hundred people is not obvious from the compose form alone.

预览模式只解析收件人而不发送：仅凭撰写界面看不出「发给一个部门」与「发给四百人」的区别。
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors.exceptions import PermissionDenied
from app.core.security.authorization.evaluator import AuthorizationContext
from app.core.security.authorization.permissions.catalog import Permission
from app.domain.audit.models.audit_log_entry import AuditAction
from app.domain.audit.services import audit_service
from app.domain.identity.models.enums import AccountStatus, AffiliationType
from app.domain.identity.models.user_account import UserAccount
from app.domain.notifications.models.email_delivery_log import (
    EmailDeliveryStatus,
    EmailTemplateKey,
)
from app.domain.notifications.schemas.messaging import BroadcastRequest, BroadcastResult
from app.domain.organization.models.department import Department
from app.domain.organization.models.membership import DepartmentMembership
from app.infrastructure.email.dispatcher import EmailDispatcher
from app.infrastructure.email.templates import activity_notice

# Addresses shown in the preview before the operator confirms; the full list is never echoed.
# 确认发送前预览展示的地址数量；完整列表不会回显。
PREVIEW_SAMPLE_SIZE = 12


async def resolve_recipients(
    session: AsyncSession, request: BroadcastRequest
) -> list[tuple[UUID, str]]:
    statement = select(UserAccount.id, UserAccount.email).where(
        UserAccount.status == AccountStatus.ACTIVE
    )

    if request.department_id is not None:
        statement = statement.where(
            select(DepartmentMembership.user_id)
            .where(
                DepartmentMembership.user_id == UserAccount.id,
                DepartmentMembership.department_id == request.department_id,
                DepartmentMembership.ended_on.is_(None),
            )
            .exists()
        )
    elif not request.include_alumni:
        statement = statement.where(UserAccount.affiliation == AffiliationType.STUDENT)

    return list((await session.execute(statement.order_by(UserAccount.email.asc()))).all())


async def send_broadcast(
    session: AsyncSession,
    context: AuthorizationContext,
    request: BroadcastRequest,
    dispatcher: EmailDispatcher,
    *,
    template_key: EmailTemplateKey = EmailTemplateKey.DEPARTMENT_BROADCAST,
) -> BroadcastResult:
    required = (
        Permission.NOTIFICATIONS_SEND_ORGANIZATION
        if request.department_id is None
        else Permission.NOTIFICATIONS_SEND_DEPARTMENT
    )
    if not context.has(required, department_id=request.department_id):
        raise PermissionDenied(
            message_en="You cannot email this audience.",
            message_zh="你没有向该范围发送邮件的权限。",
        )

    recipients = await resolve_recipients(session, request)

    if request.preview_only:
        return BroadcastResult(
            recipient_count=len(recipients),
            sent_count=0,
            skipped_count=len(recipients),
            failed_count=0,
            preview_recipients=[email for _, email in recipients[:PREVIEW_SAMPLE_SIZE]],
        )

    sender = await session.get(UserAccount, context.user_id)
    department = (
        await session.get(Department, request.department_id)
        if request.department_id
        else None
    )
    subject, html_body, text_body = activity_notice.department_broadcast(
        subject=request.subject,
        body_text=request.body,
        sender_name=sender.display_name if sender else "UTMCSSA",
        department_name_zh=department.name_zh if department else None,
    )

    sent = failed = 0
    for recipient_id, email in recipients:
        entry = await dispatcher.send(
            session,
            recipient_email=email,
            template_key=template_key,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            recipient_id=recipient_id,
        )
        if entry.status is EmailDeliveryStatus.SENT:
            sent += 1
        else:
            failed += 1

    await audit_service.record(
        session,
        action=AuditAction.BROADCAST_SENT,
        actor_id=context.user_id,
        target_type="broadcast",
        department_id=request.department_id,
        summary=(
            f"向{department.name_zh if department else '全社团'}发送了邮件"
            f"「{request.subject}」，成功 {sent} 封。"
        ),
        context={"recipient_count": len(recipients), "failed": failed},
    )

    return BroadcastResult(
        recipient_count=len(recipients),
        sent_count=sent,
        skipped_count=0,
        failed_count=failed,
    )
