"""Sign-up, email verification, and password reset endpoints.

These are the only unauthenticated write paths in the system, so each one either rate-limits by
address or returns an identical response whether or not the address exists.

这是系统中仅有的免鉴权写入路径，因此每个接口要么按地址限流，
要么无论地址是否存在都返回完全一致的响应。
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, status
from pydantic import BaseModel, EmailStr

from app.api.deps.authentication import SessionDependency
from app.api.deps.services import DispatcherDependency
from app.domain.identity.models.enums import VerificationPurpose
from app.domain.identity.schemas.authentication import (
    PasswordResetConfirmation,
    PasswordResetRequest,
)
from app.domain.identity.schemas.registration import (
    RegistrationAccepted,
    RegistrationRequest,
    VerificationCodeRequest,
    VerificationCodeSubmission,
    VerificationResult,
)
from app.domain.identity.services import authentication_service, registration_service

router = APIRouter(prefix="/auth", tags=["authentication"])


class VerificationCodeIssued(BaseModel):
    """Acknowledgement that a code was issued, without revealing whether the address exists."""

    email: EmailStr
    expires_at: datetime


@router.post("/register", response_model=RegistrationAccepted, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegistrationRequest,
    session: SessionDependency,
    dispatcher: DispatcherDependency,
) -> RegistrationAccepted:
    return await registration_service.register(session, payload, dispatcher)


@router.post("/verification-codes", response_model=VerificationCodeIssued)
async def request_verification_code(
    payload: VerificationCodeRequest,
    session: SessionDependency,
    dispatcher: DispatcherDependency,
) -> VerificationCodeIssued:
    expires_at = await registration_service.resend_verification_code(
        session,
        email=str(payload.email),
        purpose=payload.purpose,
        dispatcher=dispatcher,
    )
    return VerificationCodeIssued(email=payload.email, expires_at=expires_at)


@router.post("/verify", response_model=VerificationResult)
async def verify_email(
    payload: VerificationCodeSubmission,
    session: SessionDependency,
) -> VerificationResult:
    return await registration_service.confirm_email(
        session, email=str(payload.email), submitted_code=payload.code
    )


@router.post("/password-reset/request", status_code=status.HTTP_202_ACCEPTED)
async def request_password_reset(
    payload: PasswordResetRequest,
    session: SessionDependency,
    dispatcher: DispatcherDependency,
) -> dict[str, str]:
    await registration_service.resend_verification_code(
        session,
        email=str(payload.email),
        purpose=VerificationPurpose.PASSWORD_RESET,
        dispatcher=dispatcher,
    )
    return {
        "message_en": "If that address has an account, a reset code is on its way.",
        "message_zh": "若该邮箱已注册，重置验证码将很快送达。",
    }


@router.post("/password-reset/confirm", status_code=status.HTTP_204_NO_CONTENT)
async def confirm_password_reset(
    payload: PasswordResetConfirmation,
    session: SessionDependency,
) -> None:
    await authentication_service.reset_password(
        session,
        email=str(payload.email),
        submitted_code=payload.code,
        new_password=payload.new_password,
    )
