"""The category tree that organizes the document vault.

Categories nest without a depth limit so a department can mirror however it already files things:
an activity folder may contain a planning subfolder which in turn contains per-event folders. A
category with no department is shared across the association.

无深度限制的分类树，使各部门可直接复刻既有归档习惯：活动目录下可设策划子目录，其下再按单场活动细分。
未绑定部门的分类为全社团共享。
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.documents.models.enums import DocumentKind
from app.infrastructure.database.base import Base, TimestampMixin, UuidPrimaryKeyMixin

if TYPE_CHECKING:
    from app.domain.documents.models.document import Document


class DocumentCategory(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "document_category"
    __table_args__ = (
        UniqueConstraint(
            "department_id", "parent_id", "slug", name="uq_document_category_slug_in_parent"
        ),
    )

    slug: Mapped[str] = mapped_column(String(80), nullable=False)
    name_en: Mapped[str] = mapped_column(String(160), nullable=False)
    name_zh: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    kind: Mapped[DocumentKind] = mapped_column(
        Enum(DocumentKind, name="document_kind", native_enum=False, length=24),
        default=DocumentKind.GOVERNANCE,
        nullable=False,
    )

    # Null means the category belongs to the association as a whole rather than one department.
    # 为空表示该分类属于全社团，而非某个具体部门。
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("department.id", ondelete="CASCADE")
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("document_category.id", ondelete="CASCADE")
    )

    # Seeded categories cannot be deleted, only renamed, so the default filing structure survives
    # a careless click in the admin console.
    # 预置分类只能重命名不能删除，避免后台误操作破坏默认归档结构。
    is_system_managed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    parent: Mapped[DocumentCategory | None] = relationship(
        back_populates="children", remote_side="DocumentCategory.id"
    )
    children: Mapped[list[DocumentCategory]] = relationship(
        back_populates="parent", cascade="all, delete-orphan"
    )
    documents: Mapped[list[Document]] = relationship(back_populates="category")
