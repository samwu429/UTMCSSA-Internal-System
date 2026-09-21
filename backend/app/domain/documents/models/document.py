"""A logical file in the vault and the immutable versions behind it.

The ``Document`` row carries the identity that people refer to ("Fall Gala Budget"); each upload
creates a ``DocumentVersion`` and moves the pointer. Nothing is overwritten, so a planning document
replaced during a hectic week can still be recovered.

Document 行承载人们口头引用的那个身份（例如「秋季晚会预算」）；每次上传生成一个 DocumentVersion 并移动指针。
历史版本不被覆盖，因此忙乱期间被替换的策划文件仍可找回。
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.documents.models.enums import DocumentVisibility
from app.infrastructure.database.base import Base, JsonColumn, TimestampMixin, UuidPrimaryKeyMixin

if TYPE_CHECKING:
    from app.domain.documents.models.category import DocumentCategory


class Document(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "document"
    __table_args__ = (
        Index("ix_document_department_category", "department_id", "category_id"),
    )

    title: Mapped[str] = mapped_column(String(240), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    category_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("document_category.id", ondelete="RESTRICT"), nullable=False
    )
    # The owning department, which is what department-scoped read permissions are checked against.
    # 归属部门，部门级读取权限即以此字段为判定依据。
    department_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("department.id", ondelete="CASCADE"), nullable=False
    )

    visibility: Mapped[DocumentVisibility] = mapped_column(
        Enum(DocumentVisibility, name="document_visibility", native_enum=False, length=24),
        default=DocumentVisibility.DEPARTMENT,
        nullable=False,
    )

    tags: Mapped[list[str]] = mapped_column(JsonColumn, default=list, nullable=False)

    uploaded_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("user_account.id", ondelete="SET NULL")
    )
    current_version_id: Mapped[uuid.UUID | None] = mapped_column()
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    category: Mapped[DocumentCategory] = relationship(back_populates="documents")
    versions: Mapped[list[DocumentVersion]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="desc(DocumentVersion.version_number)",
    )

    @property
    def is_archived(self) -> bool:
        return self.archived_at is not None


class DocumentVersion(UuidPrimaryKeyMixin, TimestampMixin, Base):
    """One uploaded revision, addressed by the key the storage driver wrote it under."""

    __tablename__ = "document_version"
    __table_args__ = (
        Index("ix_document_version_document_number", "document_id", "version_number", unique=True),
    )

    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("document.id", ondelete="CASCADE"), nullable=False
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)

    # Opaque to the domain: the storage driver decides whether this is a filesystem path or an
    # object key, and only the driver interprets it.
    # 对领域层不透明：具体是文件系统路径还是对象键由存储驱动决定，也仅由驱动解释。
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(300), nullable=False)
    content_type: Mapped[str] = mapped_column(String(160), nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    checksum_sha256: Mapped[str] = mapped_column(String(64), nullable=False)

    uploaded_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("user_account.id", ondelete="SET NULL")
    )
    change_note: Mapped[str | None] = mapped_column(Text)

    document: Mapped[Document] = relationship(back_populates="versions")
