"""Roles: the named permission sets the presidium assigns to members.

Separating the bundle (``Role``) from its contents (``RolePermission``) keeps the admin console
simple: an operator picks a card by name, and the underlying permission list can be tuned later
without reassigning anyone.

角色即"权限集合"。将集合本体与其内容拆开，使管理后台的操作停留在"按名称选卡片"这一层；
后续调整集合内的权限无需重新分配成员。
"""

from __future__ import annotations

import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.security.authorization.permissions.catalog import Permission
from app.core.security.authorization.scopes import GrantScope
from app.infrastructure.database.base import Base, TimestampMixin, UuidPrimaryKeyMixin


class Role(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "role"

    # Present only on roles seeded from a template; custom roles created in the admin console have
    # no key and are identified by name alone.
    # 仅模板生成的角色带有 key；后台自建角色无 key，仅以名称标识。
    key: Mapped[str | None] = mapped_column(String(64), unique=True)

    name_en: Mapped[str] = mapped_column(String(120), nullable=False)
    name_zh: Mapped[str] = mapped_column(String(120), nullable=False)
    description_en: Mapped[str | None] = mapped_column(Text)
    description_zh: Mapped[str | None] = mapped_column(Text)

    scope: Mapped[GrantScope] = mapped_column(
        Enum(GrantScope, name="grant_scope", native_enum=False, length=16),
        default=GrantScope.DEPARTMENT,
        nullable=False,
    )

    # When set, the role is only offered inside that department's portal, keeping department-specific
    # titles out of every other department's assignment dropdown.
    # 设置后该角色仅在对应部门门户中可选，避免部门专属头衔污染其他部门的分配下拉框。
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("department.id", ondelete="CASCADE")
    )

    # System-managed roles may be edited but never deleted, so the organization cannot lock itself
    # out by removing the administrator bundle.
    # 系统角色可编辑但不可删除，避免误删管理员集合导致组织彻底失去管理入口。
    is_system_managed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    permissions: Mapped[list[RolePermission]] = relationship(
        back_populates="role",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    @property
    def permission_set(self) -> frozenset[Permission]:
        """Permissions in this bundle, skipping identifiers retired from the catalog."""
        resolved: set[Permission] = set()
        for grant in self.permissions:
            try:
                resolved.add(Permission(grant.permission))
            except ValueError:
                continue
        return frozenset(resolved)


class RolePermission(Base):
    """A single permission belonging to a role."""

    __tablename__ = "role_permission"
    __table_args__ = (UniqueConstraint("role_id", "permission", name="uq_role_permission_pair"),)

    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("role.id", ondelete="CASCADE"), primary_key=True
    )
    # Stored as text rather than a database enum so retiring a permission in code does not require
    # a migration on a live enum type.
    # 以文本而非数据库枚举存储，使代码中下线某项权限时无需对线上枚举类型执行迁移。
    permission: Mapped[str] = mapped_column(String(64), primary_key=True)

    role: Mapped[Role] = relationship(back_populates="permissions")
