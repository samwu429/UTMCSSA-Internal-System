"""Sign-up: mailbox proof first, membership decision second.

Completing this flow gets an applicant as far as ``PENDING_APPROVAL`` and no further. Nothing here
creates a department membership, which is the property that keeps a verified stranger from reading
any department's files.

注册流程：先证明邮箱，再决定成员资格。走完本流程的申请人最多到达 PENDING_APPROVAL 状态，
且此处不会创建任何部门归属——正是这一点使「已验证邮箱的陌生人」无法读取任何部门的文件。
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config.settings import get_settings
from app.core.errors.exceptions import ResourceConflict, ValidationFailed
from app.core.security.passwords import policy
from app.core.security.passwords.hashing import hash_password
from app.domain.identity.models.enums import AccountStatus, VerificationPurpose
from app.domain.identity.models.user_account import UserAccount
from app.domain.identity.schemas.registration import (
    RegistrationAccepted,
    RegistrationRequest,
    VerificationResult,
)
from app.domain.identity.services import email_eligibility, verification_service
from app.domain.notifications.models.email_delivery_log import EmailTemplateKey
from app.infrastructure.email.dispatcher import EmailDispatcher
from app.infrastructure.email.templates import verification as verification_templates


async def find_by_email(session: AsyncSession, email: str) -> UserAccount | None:
    normalized = email_eligibility.normalize(email)
    statement = select(UserAccount).where(func.lower(UserAccount.email) == normalized)
    return (await session.execute(statement)).scalar_one_or_none()


async def register(
    session: AsyncSession,
    payload: RegistrationRequest,
    dispatcher: EmailDispatcher,
) -> RegistrationAccepted:
    """Create an unverified account and email the first verification code."""
    settings = get_settings()
    eligibility = email_eligibility.evaluate(str(payload.email))

    violations = policy.evaluate(payload.password)
    if violations:
        raise ValidationFailed(
            message_en=violations[0].message_en,
            message_zh=violations[0].message_zh,
            details={
                "field": "password",
                "violations": [violation.code for violation in violations],
            },
        )

    existing = await find_by_email(session, eligibility.normalized_email)
    if existing is not None:
        # Re-registering an account that never finished verification simply replaces the password
        # and resends a code; treating it as a conflict would strand anyone who lost the email.
        # 对从未完成验证的账号重复注册时，只替换密码并重发验证码；若按冲突处理，
        # 丢失验证邮件的人将再无出路。
        if existing.status is not AccountStatus.PENDING_VERIFICATION:
            raise ResourceConflict(
                message_en="An account with this email already exists. Sign in instead.",
                message_zh="该邮箱已注册，请直接登录。",
                details={"field": "email"},
            )
        account = existing
        account.password_hash = hash_password(payload.password)
    else:
        account = UserAccount(
            email=eligibility.normalized_email,
            password_hash=hash_password(payload.password),
            legal_name=payload.legal_name.strip(),
            status=AccountStatus.PENDING_VERIFICATION,
            affiliation=eligibility.affiliation,
        )
        session.add(account)

    account.chinese_name = payload.chinese_name
    account.preferred_name = payload.preferred_name
    account.graduation_year = payload.graduation_year
    account.enrolment_year = payload.enrolment_year
    account.program_of_study = payload.program_of_study
    account.phone_number = payload.phone_number
    account.requested_department_slug = payload.requested_department_slug
    account.affiliation = eligibility.affiliation
    await session.flush()

    code, record = await verification_service.issue_code(
        session,
        email=account.email,
        purpose=VerificationPurpose.REGISTRATION,
        user=account,
    )
    subject, html_body, text_body = verification_templates.registration_code(
        code, settings.email_verification_ttl_minutes
    )
    await dispatcher.send(
        session,
        recipient_email=account.email,
        template_key=EmailTemplateKey.VERIFICATION_CODE,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        recipient_id=account.id,
    )

    return RegistrationAccepted(
        email=account.email,
        affiliation=account.affiliation,
        status=account.status,
        verification_expires_at=record.expires_at,
        message_en="A verification code has been sent to your University of Toronto mailbox.",
        message_zh="验证码已发送至你的多大邮箱，请查收后完成验证。",
    )


async def resend_verification_code(
    session: AsyncSession,
    *,
    email: str,
    purpose: VerificationPurpose,
    dispatcher: EmailDispatcher,
) -> datetime:
    """Send another code, returning when it expires.

    The response is identical whether or not the address is registered, so the endpoint cannot be
    used to enumerate which members hold accounts.

    无论地址是否已注册，响应完全一致，因此该接口无法用于枚举哪些成员拥有账号。
    """
    settings = get_settings()
    account = await find_by_email(session, email)
    normalized = email_eligibility.normalize(email)

    if account is None:
        return datetime.now(UTC)

    code, record = await verification_service.issue_code(
        session, email=normalized, purpose=purpose, user=account
    )

    if purpose is VerificationPurpose.PASSWORD_RESET:
        subject, html_body, text_body = verification_templates.password_reset_code(
            code, settings.email_verification_ttl_minutes
        )
        template_key = EmailTemplateKey.PASSWORD_RESET_CODE
    else:
        subject, html_body, text_body = verification_templates.registration_code(
            code, settings.email_verification_ttl_minutes
        )
        template_key = EmailTemplateKey.VERIFICATION_CODE

    await dispatcher.send(
        session,
        recipient_email=normalized,
        template_key=template_key,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        recipient_id=account.id,
    )
    return record.expires_at


async def confirm_email(
    session: AsyncSession, *, email: str, submitted_code: str
) -> VerificationResult:
    """Redeem a registration code and move the account into the approval queue."""
    normalized = email_eligibility.normalize(email)
    account = await find_by_email(session, normalized)
    if account is None:
        raise ValidationFailed(
            message_en="This code has expired. Request a new one.",
            message_zh="验证码已失效，请重新获取。",
            details={"field": "code"},
        )

    await verification_service.redeem_code(
        session,
        email=normalized,
        purpose=VerificationPurpose.REGISTRATION,
        submitted_code=submitted_code,
    )

    if account.email_verified_at is None:
        account.email_verified_at = datetime.now(UTC)
    if account.status is AccountStatus.PENDING_VERIFICATION:
        account.status = AccountStatus.PENDING_APPROVAL
    await session.flush()

    awaiting = account.status is AccountStatus.PENDING_APPROVAL
    return VerificationResult(
        email=account.email,
        status=account.status,
        awaiting_approval=awaiting,
        message_en=(
            "Mailbox verified. A presidium member will assign your department shortly."
            if awaiting
            else "Mailbox verified."
        ),
        message_zh=(
            "邮箱验证成功，主席团将尽快为你分配部门。" if awaiting else "邮箱验证成功。"
        ),
    )
