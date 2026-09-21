"""Projection of a loaded account into the bundle the frontend renders a portal from."""

from __future__ import annotations

from app.core.config.organization.offices import build_identity_lenses
from app.core.security.authorization.evaluator import AuthorizationContext
from app.domain.identity.models.user_account import UserAccount
from app.domain.identity.schemas.session_profile import (
    IdentityLens,
    MembershipSummary,
    PortalConfiguration,
    SessionProfile,
)
from app.domain.organization.models.department import Department


def to_portal_configuration(department: Department) -> PortalConfiguration:
    return PortalConfiguration(
        department_id=department.id,
        slug=department.slug,
        name_en=department.name_en,
        name_zh=department.name_zh,
        summary_en=department.summary_en,
        summary_zh=department.summary_zh,
        accent_color=department.accent_color,
        portal_modules=list(department.portal_modules or []),
        has_organization_oversight=department.has_organization_oversight,
        portal_path=department.portal_path,
    )


def build(account: UserAccount, context: AuthorizationContext) -> SessionProfile:
    """Identity, affiliations, permissions, and the portal the member lands on."""
    is_platform_administrator = context.is_platform_administrator
    memberships = [
        MembershipSummary(
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
        for membership in account.memberships
        if membership.is_current
    ]
    memberships.sort(key=lambda item: (not item.is_primary, item.department_name_zh))

    primary_membership = next(
        (
            membership
            for membership in account.memberships
            if membership.is_primary and membership.is_current
        ),
        None,
    ) or next((membership for membership in account.memberships if membership.is_current), None)

    return SessionProfile(
        user_id=account.id,
        email=account.email,
        display_name=account.display_name,
        legal_name=account.legal_name,
        chinese_name=account.chinese_name,
        avatar_url=account.avatar_url,
        status=account.status,
        affiliation=account.affiliation,
        graduation_year=account.graduation_year,
        program_of_study=account.program_of_study,
        memberships=memberships,
        primary_portal=(
            to_portal_configuration(primary_membership.department)
            if primary_membership is not None
            else None
        ),
        permissions=sorted(
            permission.value for permission in context.granted_permissions()
        ),
        is_platform_administrator=is_platform_administrator,
        identity_lenses=(
            [IdentityLens.model_validate(item) for item in build_identity_lenses()]
            if is_platform_administrator
            else []
        ),
        receives_daily_digest=account.receives_daily_digest,
        receives_activity_notices=account.receives_activity_notices,
        preferred_language=account.preferred_language,
        last_login_at=account.last_login_at,
    )
