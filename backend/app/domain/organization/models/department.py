"""Departments and the portal configuration each one presents to its members.

The portal a member lands on is derived entirely from this row: its accent colour, its name, and
the set of feature panels it exposes. Serving every portal from one backend while varying this
configuration is what lets each department experience the platform as its own system.

成员登录后看到的门户完全由本行数据推导：主色、名称与展示的功能面板集合。
所有门户共用同一后端、仅切换该配置，是"每个部门觉得这是自己的系统"得以成立的机制。
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base, JsonColumn, TimestampMixin, UuidPrimaryKeyMixin

if TYPE_CHECKING:
    from app.domain.organization.models.membership import DepartmentMembership


class Department(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "department"

    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name_en: Mapped[str] = mapped_column(String(120), nullable=False)
    name_zh: Mapped[str] = mapped_column(String(120), nullable=False)
    summary_en: Mapped[str | None] = mapped_column(Text)
    summary_zh: Mapped[str | None] = mapped_column(Text)

    # Hex colour that themes the department portal.
    # 用于部门门户主题的十六进制颜色。
    accent_color: Mapped[str] = mapped_column(String(9), default="#2C3E50", nullable=False)

    # Identifiers from PortalModule; validated at the service layer rather than by a database
    # constraint so the presidium can reorder panels without a migration.
    # 取值来自 PortalModule，由服务层校验而非数据库约束，使主席团调整面板顺序无需迁移。
    portal_modules: Mapped[list[str]] = mapped_column(JsonColumn, default=list, nullable=False)

    # Grants members of this department read visibility across the organization. Write access still
    # requires an explicit organization-scoped permission grant.
    # 使该部门成员获得跨部门只读可见性；写权限仍需显式的组织级授权。
    has_organization_oversight: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # Sub-teams are modelled as child departments so a large department can subdivide without a
    # second concept in the permission model.
    # 子团队建模为下级部门，使大部门可以细分而无需在权限模型中引入第二种概念。
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("department.id", ondelete="SET NULL")
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    children: Mapped[list[Department]] = relationship(
        back_populates="parent", cascade="save-update"
    )
    parent: Mapped[Department | None] = relationship(
        back_populates="children", remote_side="Department.id"
    )
    memberships: Mapped[list[DepartmentMembership]] = relationship(
        back_populates="department", cascade="all, delete-orphan"
    )

    @property
    def portal_path(self) -> str:
        """Frontend route the member is redirected to immediately after sign-in."""
        return f"/portal/{self.slug}"
