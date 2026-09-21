"""Resolution of a signed-in account's effective permissions.

The evaluator is the single arbiter of "may this account do X, here". API routes call it through
FastAPI dependencies; services call it directly when a decision depends on row-level context. It
operates on an immutable snapshot assembled at authentication time so a request cannot observe a
half-applied permission change.

对已登录账号有效权限的求值器，是「此账号能否在此处执行某操作」的唯一裁决点。API 路由通过依赖注入调用，
服务层在需要行级上下文时直接调用。求值基于认证时装配的不可变快照，避免请求中途读到部分生效的权限变更。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from uuid import UUID

from app.core.security.authorization.permissions.catalog import Permission
from app.core.security.authorization.scopes import GrantScope


@dataclass(frozen=True, slots=True)
class DepartmentMembershipSnapshot:
    """One department affiliation together with the permissions it confers."""

    department_id: UUID
    department_slug: str
    is_primary: bool
    permissions: frozenset[Permission]
    scope: GrantScope


@dataclass(frozen=True, slots=True)
class AuthorizationContext:
    """Everything needed to answer authorization questions for one request."""

    user_id: UUID
    memberships: tuple[DepartmentMembershipSnapshot, ...]
    is_active: bool = True

    # Permissions granted organization-wide, precomputed because they short-circuit every check.
    # 预先计算的组织级权限，用于快速短路判定。
    _organization_permissions: frozenset[Permission] = field(
        default_factory=frozenset, repr=False, compare=False
    )

    @classmethod
    def build(
        cls,
        user_id: UUID,
        memberships: tuple[DepartmentMembershipSnapshot, ...],
        *,
        is_active: bool = True,
    ) -> AuthorizationContext:
        organization_permissions: set[Permission] = set()
        for membership in memberships:
            if membership.scope is GrantScope.ORGANIZATION:
                organization_permissions |= membership.permissions
        return cls(
            user_id=user_id,
            memberships=memberships,
            is_active=is_active,
            _organization_permissions=frozenset(organization_permissions),
        )

    @property
    def primary_department_slug(self) -> str | None:
        for membership in self.memberships:
            if membership.is_primary:
                return membership.department_slug
        return self.memberships[0].department_slug if self.memberships else None

    @property
    def primary_department_id(self) -> UUID | None:
        for membership in self.memberships:
            if membership.is_primary:
                return membership.department_id
        return self.memberships[0].department_id if self.memberships else None

    @property
    def department_ids(self) -> frozenset[UUID]:
        return frozenset(membership.department_id for membership in self.memberships)

    @property
    def has_organization_reach(self) -> bool:
        """True when at least one role applies across the whole association."""
        return bool(self._organization_permissions)

    def granted_permissions(self) -> frozenset[Permission]:
        """Union of every permission held anywhere; used to drive frontend navigation only."""
        granted: set[Permission] = set(self._organization_permissions)
        for membership in self.memberships:
            granted |= membership.permissions
        return frozenset(granted)

    def has(self, permission: Permission, *, department_id: UUID | None = None) -> bool:
        """Whether the account holds ``permission``, optionally within a specific department.

        Passing ``department_id=None`` asks whether the permission is held anywhere, which suits
        navigation and listing endpoints that filter rows afterwards. Passing a department narrows
        the question to that department and is what mutating endpoints must use.

        department_id 为 None 时判断「是否在任意范围持有该权限」，适用于随后还会过滤数据的列表类接口；
        传入具体部门时收敛为「是否在该部门持有」，写操作必须使用后者。
        """
        if not self.is_active:
            return False
        if permission in self._organization_permissions:
            return True
        for membership in self.memberships:
            if permission not in membership.permissions:
                continue
            if department_id is None or membership.department_id == department_id:
                return True
        return False

    def departments_allowing(self, permission: Permission) -> frozenset[UUID] | None:
        """Departments where ``permission`` holds, or ``None`` when it holds organization-wide.

        A ``None`` result is the caller's signal to skip department filtering entirely rather than
        to build an ``IN ()`` clause over every department.

        返回持有该权限的部门集合；返回 None 表示组织级持有，调用方应直接跳过部门过滤。
        """
        if not self.is_active:
            return frozenset()
        if permission in self._organization_permissions:
            return None
        return frozenset(
            membership.department_id
            for membership in self.memberships
            if permission in membership.permissions
        )
