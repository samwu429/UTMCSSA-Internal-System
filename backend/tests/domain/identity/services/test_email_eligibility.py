"""Registration mailbox checks.

These tests pin the rule the rest of the join flow depends on: only University of Toronto student
and alumni domains may create an account, and the domain itself decides affiliation.

这些测试固定加入流程所依赖的规则：仅多伦多大学在校生与校友域名可注册，且域名本身决定身份。
"""

from __future__ import annotations

import pytest

from app.core.errors.exceptions import ValidationFailed
from app.domain.identity.models.enums import AffiliationType
from app.domain.identity.services import email_eligibility


def test_student_mailbox_is_accepted() -> None:
    result = email_eligibility.evaluate("  Sam.Wu@mail.utoronto.ca ")
    assert result.normalized_email == "sam.wu@mail.utoronto.ca"
    assert result.affiliation is AffiliationType.STUDENT


def test_alumni_mailbox_is_accepted() -> None:
    result = email_eligibility.evaluate("grad@alum.utoronto.ca")
    assert result.affiliation is AffiliationType.ALUMNUS


def test_unrelated_mailbox_is_refused() -> None:
    with pytest.raises(ValidationFailed) as raised:
        email_eligibility.evaluate("someone@gmail.com")
    assert raised.value.details["field"] == "email"


def test_incomplete_address_is_refused() -> None:
    with pytest.raises(ValidationFailed):
        email_eligibility.evaluate("not-an-email")
