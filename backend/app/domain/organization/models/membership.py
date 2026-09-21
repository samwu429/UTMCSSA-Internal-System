"""The link between a person, a department, and the permission set they hold there.

A member may sit in several departments at once - a presidium member who also runs Publicity, for
instance. Exactly one membership is marked primary, and that one decides which portal they land on
after signing in.

个人、部门与其在该部门所持权限集合之间的关联。一名成员可同时属于多个部门（例如兼任宣传部的主席团成员）。
其中恰有一条标记为主归属，决定登录后落地的门户。
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base, TimestampMixin, UuidPrimaryKeyMixin

if TYPE_CHECKING:
    from app.domain.identity.models.user_account import UserAccount
    from app.domain.organization.models.department import Department
    from app.domain.organization.models.role import Role


class DepartmentMembership(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "department_membership"
    __table_args__ = (
        UniqueConstraint("user_id", "department_id", name="uq_department_membership_user_dept"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user_account.id", ondelete="CASCADE"), nullable=False
    )
    department_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("department.id", ondelete="CASCADE"), nullable=False
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("role.id", ondelete="RESTRICT"), nullable=False
    )

    is_primary: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Human-facing title such as Director or Officer, independent of the permission set so a person
    # can hold a ceremonial title without inheriting its usual permissions.
    # 面向人的头衔（如部长、干事），与权限集合解耦，使荣誉性头衔不会自动带来对应权限。
    title_en: Mapped[str | None] = mapped_column(String(120))
    title_zh: Mapped[str | None] = mapped_column(String(120))

    # Academic year the appointment covers, for example "2026-2027".
    # 任期所属学年，例如 "2026-2027"。
    term_label: Mapped[str | None] = mapped_column(String(32))
    joined_on: Mapped[date | None] = mapped_column(Date)
    ended_on: Mapped[date | None] = mapped_column(Date)

    user: Mapped[UserAccount] = relationship(back_populates="memberships")
    department: Mapped[Department] = relationship(
        back_populates="memberships", lazy="selectin"
    )
    role: Mapped[Role] = relationship(lazy="selectin")

    @property
    def is_current(self) -> bool:
        return self.ended_on is None
