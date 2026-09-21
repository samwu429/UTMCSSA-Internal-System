"""Office titles used for assignment and for the hidden administrator identity switcher.

Regular departments have a director, a deputy, and members. The presidium has four named seats.
The platform administrator office is never offered to anyone else.

各部门职位为部长、副部长、部员；主席团为四个具名席位。平台管理员职位不对其他人开放。
"""

from __future__ import annotations

PRESIDIUM_DEPARTMENT_SLUG = "presidium"
PLATFORM_ADMIN_DEPARTMENT_SLUG = "platform-admin"

DEPARTMENT_MEMBER_ROLE_KEY = "department_member"
DEPARTMENT_DEPUTY_ROLE_KEY = "department_deputy"
DEPARTMENT_DIRECTOR_ROLE_KEY = "department_lead"
PRESIDIUM_PRESIDENT_ROLE_KEY = "executive"
PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY = "presidium_secretary_general"
PRESIDIUM_INTERNAL_VP_ROLE_KEY = "presidium_internal_vp"
PRESIDIUM_EXTERNAL_VP_ROLE_KEY = "presidium_external_vp"
PLATFORM_ADMINISTRATOR_ROLE_KEY = "platform_administrator"
ALUMNUS_ROLE_KEY = "alumnus"
RETIRED_OFFICER_ROLE_KEY = "department_officer"

DEPARTMENT_OFFICE_KEYS: tuple[str, ...] = (
    DEPARTMENT_DIRECTOR_ROLE_KEY,
    DEPARTMENT_DEPUTY_ROLE_KEY,
    DEPARTMENT_MEMBER_ROLE_KEY,
)

PRESIDIUM_OFFICE_KEYS: tuple[str, ...] = (
    PRESIDIUM_PRESIDENT_ROLE_KEY,
    PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY,
    PRESIDIUM_INTERNAL_VP_ROLE_KEY,
    PRESIDIUM_EXTERNAL_VP_ROLE_KEY,
)

HIDDEN_ROLE_KEYS: frozenset[str] = frozenset(
    {PLATFORM_ADMINISTRATOR_ROLE_KEY, RETIRED_OFFICER_ROLE_KEY}
)


def office_keys_for_department(slug: str) -> tuple[str, ...]:
    """Permission-set keys that may be assigned inside one department."""
    if slug == PLATFORM_ADMIN_DEPARTMENT_SLUG:
        return (PLATFORM_ADMINISTRATOR_ROLE_KEY,)
    if slug == PRESIDIUM_DEPARTMENT_SLUG:
        return PRESIDIUM_OFFICE_KEYS
    return DEPARTMENT_OFFICE_KEYS


def build_identity_lenses() -> list[dict[str, object]]:
    """Every department-and-office pair the hidden administrator may preview."""
    from app.core.config.organization.departments import DEPARTMENT_BLUEPRINTS
    from app.core.config.organization.role_templates import ROLE_TEMPLATES_BY_KEY

    lenses: list[dict[str, object]] = []
    for blueprint in DEPARTMENT_BLUEPRINTS:
        for office_key in office_keys_for_department(blueprint.slug):
            template = ROLE_TEMPLATES_BY_KEY[office_key]
            lenses.append(
                {
                    "department_slug": blueprint.slug,
                    "department_name_en": blueprint.name_en,
                    "department_name_zh": blueprint.name_zh,
                    "office_key": template.key,
                    "office_name_en": template.name_en,
                    "office_name_zh": template.name_zh,
                    "permissions": [permission.value for permission in template.permissions],
                }
            )
    return lenses
