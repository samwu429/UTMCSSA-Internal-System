"""Request and response shapes for the sign-up and email verification flow."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.domain.identity.models.enums import AccountStatus, AffiliationType, VerificationPurpose


class RegistrationRequest(BaseModel):
    """Everything collected on the sign-up form.

    ``requested_department_slug`` is a preference, not a decision: the presidium confirms placement
    during approval, which is why the field is optional and never trusted for authorization.

    requested_department_slug 仅为意向而非结论，最终归属由主席团在审批时确认，
    因此该字段可空且绝不参与鉴权。
    """

    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    legal_name: str = Field(min_length=1, max_length=120)
    chinese_name: str | None = Field(default=None, max_length=60)
    preferred_name: str | None = Field(default=None, max_length=60)
    graduation_year: int | None = Field(default=None, ge=1960, le=2100)
    enrolment_year: int | None = Field(default=None, ge=1960, le=2100)
    program_of_study: str | None = Field(default=None, max_length=160)
    phone_number: str | None = Field(default=None, max_length=32)
    requested_department_slug: str | None = Field(default=None, max_length=64)


class RegistrationAccepted(BaseModel):
    """Confirmation that a verification code is on its way."""

    email: EmailStr
    affiliation: AffiliationType
    status: AccountStatus
    verification_expires_at: datetime
    message_en: str
    message_zh: str


class VerificationCodeRequest(BaseModel):
    """Ask for a fresh code, used both for first verification and for resends."""

    email: EmailStr
    purpose: VerificationPurpose = VerificationPurpose.REGISTRATION


class VerificationCodeSubmission(BaseModel):
    """Submission of the code the member received by email."""

    email: EmailStr
    code: str = Field(min_length=4, max_length=12)
    purpose: VerificationPurpose = VerificationPurpose.REGISTRATION


class VerificationResult(BaseModel):
    """Outcome of verifying a code, including what the member should do next."""

    model_config = ConfigDict(from_attributes=True)

    email: EmailStr
    status: AccountStatus
    # Approval is a human step, so the frontend shows a waiting screen rather than the portal.
    # 审批为人工环节，因此前端在此状态下展示等待页而非门户。
    awaiting_approval: bool
    message_en: str
    message_zh: str
