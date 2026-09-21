"""Server-side record of an active browser session.

Access tokens are stateless and short-lived; this table is what makes sign-out, forced logout on
password change, and per-device revocation possible. Rotation on every refresh means a replayed
token is detectable: the presented digest will already be marked as rotated.

访问令牌无状态且短时有效；本表使退出登录、改密后强制下线与按设备吊销成为可能。
每次刷新都轮换令牌，因此重放可被检测——被重放的摘要已标记为已轮换。
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.base import Base, TimestampMixin, UuidPrimaryKeyMixin


class RefreshSession(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "refresh_session"
    __table_args__ = (Index("ix_refresh_session_user_active", "user_id", "revoked_at"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user_account.id", ondelete="CASCADE"), nullable=False
    )
    token_digest: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rotated_to_id: Mapped[uuid.UUID | None] = mapped_column()

    user_agent: Mapped[str | None] = mapped_column(String(300))
    ip_address: Mapped[str | None] = mapped_column(String(64))

    def is_active(self, now: datetime) -> bool:
        return self.revoked_at is None and self.expires_at > now
