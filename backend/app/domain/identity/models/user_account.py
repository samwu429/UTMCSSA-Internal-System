"""The account record: credentials, identity attributes, and notification preferences.

One row represents one person for the lifetime of their involvement with the association. A student
who graduates keeps the same row; only ``affiliation`` and the department memberships change, which
is what makes the alumni network continuous with the active-member directory.

一行代表一个人在社团期间的完整生命周期。学生毕业后沿用同一行数据，仅 affiliation 与部门归属发生变化，
这正是校友网络与在校成员名录能够连续衔接的原因。
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.identity.models.enums import AccountStatus, AffiliationType
from app.infrastructure.database.base import Base, TimestampMixin, UuidPrimaryKeyMixin

if TYPE_CHECKING:
    from app.domain.directory.models.alumni_profile import AlumniProfile
    from app.domain.organization.models.membership import DepartmentMembership


class UserAccount(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "user_account"
    __table_args__ = (
        Index("ix_user_account_status_graduation", "status", "graduation_year"),
    )

    # Stored lowercase; the registration service normalizes before insert so the unique constraint
    # is genuinely case-insensitive without requiring a database extension.
    # 统一小写存储；注册服务在写入前归一化，无需数据库扩展即可实现大小写不敏感的唯一约束。
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    legal_name: Mapped[str] = mapped_column(String(120), nullable=False)
    chinese_name: Mapped[str | None] = mapped_column(String(60))
    preferred_name: Mapped[str | None] = mapped_column(String(60))
    pronouns: Mapped[str | None] = mapped_column(String(40))

    status: Mapped[AccountStatus] = mapped_column(
        Enum(AccountStatus, name="account_status", native_enum=False, length=32),
        default=AccountStatus.PENDING_VERIFICATION,
        nullable=False,
    )
    affiliation: Mapped[AffiliationType] = mapped_column(
        Enum(AffiliationType, name="affiliation_type", native_enum=False, length=16),
        default=AffiliationType.STUDENT,
        nullable=False,
    )

    # Academic identity shown in the member list. Graduation year drives both the roster grouping
    # and the automatic transition into the alumni network.
    # 成员名录中展示的学业信息。毕业年份同时决定名录分组与自动转入校友网络的时机。
    graduation_year: Mapped[int | None] = mapped_column(Integer)
    enrolment_year: Mapped[int | None] = mapped_column(Integer)
    program_of_study: Mapped[str | None] = mapped_column(String(160))
    campus: Mapped[str | None] = mapped_column(String(60), default="UTM")

    # Department the applicant asked to join. Advisory only: it is shown to the reviewer and never
    # consulted when resolving permissions.
    # 申请人期望加入的部门。仅供审批人参考，不参与任何权限判定。
    requested_department_slug: Mapped[str | None] = mapped_column(String(64))

    phone_number: Mapped[str | None] = mapped_column(String(32))
    wechat_id: Mapped[str | None] = mapped_column(String(64))
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    biography: Mapped[str | None] = mapped_column(Text)

    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    approved_by_id: Mapped[uuid.UUID | None] = mapped_column()
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Failed sign-in attempts since the last success; drives temporary lockout.
    # 自上次成功登录以来的失败次数，用于临时锁定。
    failed_login_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    receives_daily_digest: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    receives_activity_notices: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    preferred_language: Mapped[str] = mapped_column(String(8), default="zh", nullable=False)

    memberships: Mapped[list[DepartmentMembership]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    alumni_profile: Mapped[AlumniProfile | None] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )

    @property
    def display_name(self) -> str:
        """Name shown in the member list, preferring what the person asked to be called."""
        return self.preferred_name or self.legal_name

    @property
    def can_sign_in(self) -> bool:
        return self.status in {AccountStatus.ACTIVE, AccountStatus.PENDING_APPROVAL}
