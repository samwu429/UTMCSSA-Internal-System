"""Gatekeeping of which mailboxes may create an account.

Membership is proven by controlling a University of Toronto mailbox. The same check also decides
whether the applicant is a current student or a graduate, because the alumni domain is only issued
after graduation - so the address itself carries the affiliation.

以「能否收发多伦多大学邮件」作为成员资格的证明。该检查同时判定申请人是在校生还是毕业生：
校友域名仅在毕业后发放，因此地址本身即携带身份信息。
"""

from __future__ import annotations

from dataclasses import dataclass

from app.core.config.settings import get_settings
from app.core.errors.exceptions import ValidationFailed
from app.domain.identity.models.enums import AffiliationType


@dataclass(frozen=True, slots=True)
class EligibilityResult:
    """Normalized address plus the affiliation implied by its domain."""

    normalized_email: str
    domain: str
    affiliation: AffiliationType


def normalize(email: str) -> str:
    """Lowercase and trim so the unique constraint on the account table behaves predictably."""
    return email.strip().lower()


def evaluate(email: str) -> EligibilityResult:
    """Accept a University of Toronto address, or explain precisely why it was refused."""
    settings = get_settings()
    normalized = normalize(email)

    local_part, separator, domain = normalized.partition("@")
    if not separator or not local_part or not domain:
        raise ValidationFailed(
            message_en="Enter a complete email address.",
            message_zh="请输入完整的邮箱地址。",
            details={"field": "email"},
        )

    if domain in settings.alumni_email_domains:
        return EligibilityResult(normalized, domain, AffiliationType.ALUMNUS)
    if domain in settings.student_email_domains:
        return EligibilityResult(normalized, domain, AffiliationType.STUDENT)

    accepted = ", ".join(f"@{item}" for item in settings.accepted_email_domains)
    raise ValidationFailed(
        message_en=(
            "Registration is limited to University of Toronto addresses. "
            f"Accepted domains: {accepted}."
        ),
        message_zh=f"注册仅限多伦多大学邮箱。可用域名：{accepted}。",
        details={"field": "email", "accepted_domains": list(settings.accepted_email_domains)},
    )


def is_eligible(email: str) -> bool:
    """Boolean form of :func:`evaluate` for call sites that only need a yes or no."""
    try:
        evaluate(email)
    except ValidationFailed:
        return False
    return True
