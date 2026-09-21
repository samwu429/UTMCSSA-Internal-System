from uuid import uuid4

from app.core.config.organization.appointment_rules import (
    can_appoint_office,
    can_review_department,
    reviewable_department_slugs,
    seat_limit_for,
)
from app.core.config.organization.offices import (
    DEPARTMENT_DEPUTY_ROLE_KEY,
    DEPARTMENT_DIRECTOR_ROLE_KEY,
    DEPARTMENT_MEMBER_ROLE_KEY,
    PRESIDIUM_DEPARTMENT_SLUG,
    PRESIDIUM_PRESIDENT_ROLE_KEY,
    PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY,
)
from app.core.security.authorization.evaluator import (
    AuthorizationContext,
    DepartmentMembershipSnapshot,
)
from app.core.security.authorization.permissions.catalog import Permission
from app.core.security.authorization.scopes import GrantScope


def _context(*memberships: DepartmentMembershipSnapshot) -> AuthorizationContext:
    return AuthorizationContext.build(uuid4(), memberships)


def _office(department_id, slug: str, role_key: str, *, org: bool = False) -> DepartmentMembershipSnapshot:
    return DepartmentMembershipSnapshot(
        department_id=department_id,
        department_slug=slug,
        is_primary=True,
        permissions=frozenset({Permission.ADMIN_ASSIGN_DEPARTMENTS}),
        scope=GrantScope.ORGANIZATION if org else GrantScope.DEPARTMENT,
        role_key=role_key,
    )


def test_president_appoints_directors_and_presidium() -> None:
    events_id = uuid4()
    presidium_id = uuid4()
    context = _context(_office(presidium_id, PRESIDIUM_DEPARTMENT_SLUG, PRESIDIUM_PRESIDENT_ROLE_KEY, org=True))

    assert can_appoint_office(
        context,
        department_id=events_id,
        department_slug="events",
        office_key=DEPARTMENT_DIRECTOR_ROLE_KEY,
    )
    assert can_appoint_office(
        context,
        department_id=presidium_id,
        department_slug=PRESIDIUM_DEPARTMENT_SLUG,
        office_key=PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY,
    )
    assert can_appoint_office(
        context,
        department_id=presidium_id,
        department_slug=PRESIDIUM_DEPARTMENT_SLUG,
        office_key=PRESIDIUM_PRESIDENT_ROLE_KEY,
    )
    assert not can_appoint_office(
        context,
        department_id=events_id,
        department_slug="events",
        office_key=DEPARTMENT_DEPUTY_ROLE_KEY,
    )


def test_director_appoints_two_deputies_and_admits_members() -> None:
    events_id = uuid4()
    finance_id = uuid4()
    context = _context(_office(events_id, "events", DEPARTMENT_DIRECTOR_ROLE_KEY))

    assert seat_limit_for(DEPARTMENT_DEPUTY_ROLE_KEY) == 2
    assert can_appoint_office(
        context,
        department_id=events_id,
        department_slug="events",
        office_key=DEPARTMENT_DEPUTY_ROLE_KEY,
    )
    assert can_appoint_office(
        context,
        department_id=events_id,
        department_slug="events",
        office_key=DEPARTMENT_MEMBER_ROLE_KEY,
    )
    assert not can_appoint_office(
        context,
        department_id=finance_id,
        department_slug="finance",
        office_key=DEPARTMENT_DEPUTY_ROLE_KEY,
    )
    assert reviewable_department_slugs(context) == frozenset({"events"})
    assert can_review_department(context, department_id=events_id, department_slug="events")


def test_deputy_admits_members_but_cannot_appoint_officers() -> None:
    events_id = uuid4()
    context = _context(_office(events_id, "events", DEPARTMENT_DEPUTY_ROLE_KEY))

    assert can_appoint_office(
        context,
        department_id=events_id,
        department_slug="events",
        office_key=DEPARTMENT_MEMBER_ROLE_KEY,
    )
    assert not can_appoint_office(
        context,
        department_id=events_id,
        department_slug="events",
        office_key=DEPARTMENT_DEPUTY_ROLE_KEY,
    )
    assert not can_appoint_office(
        context,
        department_id=events_id,
        department_slug="events",
        office_key=DEPARTMENT_DIRECTOR_ROLE_KEY,
    )
