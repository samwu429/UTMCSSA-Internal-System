"""Assembly of the per-request authorization snapshot.

Reading permissions from the database on every request, rather than trusting a claim baked into
the token, is what makes a revoked role take effect immediately. The cost is one indexed query
with eager-loaded roles, which is acceptable for an association of a few hundred accounts.

每次请求都从数据库读取权限、而非信任令牌中的声明，是权限回收得以立即生效的原因。
代价是一次带预加载角色的索引查询，对于数百账号规模的社团完全可以接受。
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security.authorization.evaluator import (
    AuthorizationContext,
    DepartmentMembershipSnapshot,
)
from app.domain.identity.models.enums import AccountStatus
from app.domain.identity.models.user_account import UserAccount
from app.domain.organization.models.membership import DepartmentMembership
from app.domain.organization.models.role import Role


async def load_account(session: AsyncSession, user_id: UUID) -> UserAccount | None:
    """Fetch an account with the memberships, departments, and roles the request will need."""
    statement = (
        select(UserAccount)
        .where(UserAccount.id == user_id)
        .options(
            selectinload(UserAccount.memberships)
            .selectinload(DepartmentMembership.department),
            selectinload(UserAccount.memberships)
            .selectinload(DepartmentMembership.role)
            .selectinload(Role.permissions),
        )
    )
    return (await session.execute(statement)).unique().scalar_one_or_none()


def build_context(account: UserAccount) -> AuthorizationContext:
    """Project a loaded account into the immutable snapshot the evaluator consumes."""
    snapshots = tuple(
        DepartmentMembershipSnapshot(
            department_id=membership.department_id,
            department_slug=membership.department.slug,
            is_primary=membership.is_primary,
            permissions=membership.role.permission_set,
            scope=membership.role.scope,
        )
        for membership in account.memberships
        if membership.is_current and membership.department.is_active
    )
    return AuthorizationContext.build(
        user_id=account.id,
        memberships=snapshots,
        is_active=account.status is AccountStatus.ACTIVE,
    )
