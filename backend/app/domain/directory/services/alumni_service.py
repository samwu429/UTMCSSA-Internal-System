"""The alumni network: graduates browsable by current students.

A graduate appears here when their account is marked as alumni affiliation. Whether their contact
channels are shown depends on the switches they set themselves, which is what makes the network
sustainable rather than a one-time export that nobody updates.

校友网络：供在校生浏览的毕业生名录。账号标记为校友身份即出现在此。
联系方式是否展示由校友本人开关决定——这一点使网络得以持续维护，而非一份无人更新的一次性导出表。
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors.exceptions import PermissionDenied, ResourceNotFound
from app.core.security.authorization.evaluator import AuthorizationContext
from app.core.security.authorization.permissions.catalog import Permission
from app.domain.directory.models.alumni_profile import AlumniProfile
from app.domain.directory.schemas.alumni import (
    AlumniPage,
    AlumniProfileUpdate,
    AlumniSummary,
)
from app.domain.identity.models.enums import AccountStatus, AffiliationType
from app.domain.identity.models.user_account import UserAccount

MAX_PAGE_SIZE = 60


def _base_query() -> Select:
    return (
        select(UserAccount)
        .where(
            UserAccount.affiliation == AffiliationType.ALUMNUS,
            UserAccount.status.in_([AccountStatus.ACTIVE, AccountStatus.PENDING_APPROVAL]),
        )
        .options(selectinload(UserAccount.alumni_profile))
    )


def to_summary(account: UserAccount, *, include_contact: bool) -> AlumniSummary:
    profile = account.alumni_profile
    return AlumniSummary(
        user_id=account.id,
        display_name=account.display_name,
        chinese_name=account.chinese_name,
        avatar_url=account.avatar_url,
        graduation_year=account.graduation_year,
        program_of_study=account.program_of_study,
        degree=profile.degree if profile else None,
        current_employer=profile.current_employer if profile else None,
        current_role=profile.current_role if profile else None,
        industry=profile.industry if profile else None,
        city=profile.city if profile else None,
        country=profile.country if profile else None,
        expertise_tags=list(profile.expertise_tags) if profile else [],
        open_to_mentorship=bool(profile and profile.open_to_mentorship),
        open_to_referrals=bool(profile and profile.open_to_referrals),
        message_to_students=profile.message_to_students if profile else None,
        # Contact channels follow the graduate's own opt-in, then the viewer's permission.
        # 联系方式先看校友本人的开关，再看查看者的权限。
        email=account.email if include_contact and _reachable(profile) else None,
        linkedin_url=profile.linkedin_url if profile and _reachable(profile) else None,
        personal_site_url=profile.personal_site_url if profile and _reachable(profile) else None,
    )


def _reachable(profile: AlumniProfile | None) -> bool:
    return bool(profile and (profile.open_to_mentorship or profile.open_to_referrals))


async def list_alumni(
    session: AsyncSession,
    context: AuthorizationContext,
    *,
    search: str | None = None,
    graduation_year: int | None = None,
    industry: str | None = None,
    city: str | None = None,
    open_to_mentorship: bool | None = None,
    page: int = 1,
    page_size: int = 24,
) -> AlumniPage:
    if not context.has(Permission.ALUMNI_VIEW):
        raise PermissionDenied(
            message_en="You do not have access to the alumni network.",
            message_zh="你没有查看校友网络的权限。",
        )

    page = max(page, 1)
    page_size = min(max(page_size, 1), MAX_PAGE_SIZE)
    can_manage = context.has(Permission.ALUMNI_MANAGE)

    statement = _base_query()
    if not can_manage:
        # Graduates who hid themselves stay visible to the presidium but not to students.
        # 选择隐藏的校友对主席团仍可见，对在校生不可见。
        statement = statement.where(
            or_(
                UserAccount.alumni_profile.has(AlumniProfile.is_discoverable.is_(True)),
                UserAccount.alumni_profile == None,  # noqa: E711 - SQL NULL comparison
            )
        )

    if graduation_year is not None:
        statement = statement.where(UserAccount.graduation_year == graduation_year)
    if industry:
        statement = statement.where(
            UserAccount.alumni_profile.has(
                func.lower(AlumniProfile.industry) == industry.strip().lower()
            )
        )
    if city:
        statement = statement.where(
            UserAccount.alumni_profile.has(
                func.lower(AlumniProfile.city) == city.strip().lower()
            )
        )
    if open_to_mentorship is not None:
        statement = statement.where(
            UserAccount.alumni_profile.has(
                AlumniProfile.open_to_mentorship.is_(open_to_mentorship)
            )
        )
    if search:
        pattern = f"%{search.strip().lower()}%"
        statement = statement.where(
            or_(
                func.lower(UserAccount.legal_name).like(pattern),
                func.lower(func.coalesce(UserAccount.chinese_name, "")).like(pattern),
                func.lower(func.coalesce(UserAccount.program_of_study, "")).like(pattern),
                UserAccount.alumni_profile.has(
                    func.lower(func.coalesce(AlumniProfile.current_employer, "")).like(pattern)
                ),
            )
        )

    total = (
        await session.execute(select(func.count()).select_from(statement.subquery()))
    ).scalar_one()

    rows = (
        (
            await session.execute(
                statement.order_by(
                    UserAccount.graduation_year.desc().nullslast(),
                    UserAccount.legal_name.asc(),
                )
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        .unique()
        .scalars()
        .all()
    )

    include_contact = context.has(Permission.DIRECTORY_VIEW_CONTACT_DETAILS) or can_manage
    return AlumniPage(
        items=[to_summary(row, include_contact=include_contact) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


async def get_alumnus(
    session: AsyncSession, context: AuthorizationContext, user_id: UUID
) -> AlumniSummary:
    if not context.has(Permission.ALUMNI_VIEW):
        raise PermissionDenied(
            message_en="You do not have access to the alumni network.",
            message_zh="你没有查看校友网络的权限。",
        )
    account = (
        await session.execute(_base_query().where(UserAccount.id == user_id))
    ).unique().scalar_one_or_none()
    if account is None:
        raise ResourceNotFound(
            message_en="That alumnus could not be found.",
            message_zh="未找到该校友。",
        )
    include_contact = context.has(Permission.DIRECTORY_VIEW_CONTACT_DETAILS) or context.has(
        Permission.ALUMNI_MANAGE
    )
    return to_summary(account, include_contact=include_contact)


async def upsert_own_profile(
    session: AsyncSession, account: UserAccount, payload: AlumniProfileUpdate
) -> AlumniSummary:
    """Create or amend the signed-in graduate's own network entry."""
    profile = account.alumni_profile
    if profile is None:
        profile = AlumniProfile(user_id=account.id)
        session.add(profile)
        account.alumni_profile = profile

    for field_name, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field_name, value)

    await session.flush()
    return to_summary(account, include_contact=True)
