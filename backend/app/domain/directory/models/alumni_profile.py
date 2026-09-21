"""Post-graduation details that extend a member's record into the alumni network.

Kept apart from ``UserAccount`` because these fields only become meaningful after graduation and
because alumni control their own visibility: a graduate can stay listed while hiding their employer
or opting out of mentorship requests.

与 UserAccount 分表存放：这些字段仅在毕业后有意义，且校友自行控制可见性——
可以保留在名录中，同时隐藏雇主信息或关闭导师请求。
"""

from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.identity.models.user_account import UserAccount
from app.infrastructure.database.base import Base, JsonColumn, TimestampMixin, UuidPrimaryKeyMixin


class AlumniProfile(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "alumni_profile"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user_account.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    degree: Mapped[str | None] = mapped_column(String(160))
    current_employer: Mapped[str | None] = mapped_column(String(160))
    current_role: Mapped[str | None] = mapped_column(String(160))
    industry: Mapped[str | None] = mapped_column(String(120))
    city: Mapped[str | None] = mapped_column(String(120))
    country: Mapped[str | None] = mapped_column(String(120))
    linkedin_url: Mapped[str | None] = mapped_column(String(300))
    personal_site_url: Mapped[str | None] = mapped_column(String(300))

    # Free-form tags such as "Software", "Consulting", "Graduate School"; used to match current
    # students with alumni working in a field they are curious about.
    # 自由标签（如「软件」「咨询」「读研」），用于把在校生与其感兴趣领域的校友进行匹配。
    expertise_tags: Mapped[list[str]] = mapped_column(JsonColumn, default=list, nullable=False)

    open_to_mentorship: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    open_to_referrals: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # When false the profile is hidden from current students but remains visible to the presidium.
    # 为 false 时对在校生隐藏，但主席团仍可见。
    is_discoverable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    message_to_students: Mapped[str | None] = mapped_column(Text)

    user: Mapped[UserAccount] = relationship(back_populates="alumni_profile")
