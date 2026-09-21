"""One-time numeric codes emailed to prove control of a mailbox.

Only the digest is persisted, and each row tracks its own attempt counter so a code can be retired
after repeated wrong guesses without locking the underlying account.

仅存储验证码摘要；每行独立记录尝试次数，多次输错后可单独作废该验证码而不牵连账号本身。
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.identity.models.enums import VerificationPurpose
from app.infrastructure.database.base import Base, TimestampMixin, UuidPrimaryKeyMixin


class EmailVerificationCode(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "email_verification_code"
    __table_args__ = (
        Index("ix_email_verification_code_lookup", "email", "purpose", "consumed_at"),
    )

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("user_account.id", ondelete="CASCADE")
    )
    # Recorded separately from the account so a code survives an email-change flow where the target
    # address is not yet the account's address.
    # 与账号分开记录，使换绑邮箱流程中目标地址尚未成为账号邮箱时验证码仍然有效。
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    purpose: Mapped[VerificationPurpose] = mapped_column(
        Enum(VerificationPurpose, name="verification_purpose", native_enum=False, length=24),
        nullable=False,
    )

    code_digest: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    def is_usable(self, now: datetime, max_attempts: int) -> bool:
        return (
            self.consumed_at is None
            and self.expires_at > now
            and self.attempt_count < max_attempts
        )
