"""The filing tree behind the document vault.

Categories are returned as a nested structure rather than a flat list with parent pointers,
because the sidebar that consumes them is itself a tree and rebuilding it on the client for every
render would duplicate logic that belongs in one place.

分类以嵌套结构返回，而非带父指针的扁平列表：消费方侧边栏本身就是一棵树，
若让客户端每次渲染都重建，等于把本应只存在一处的逻辑复制一份。
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors.exceptions import PermissionDenied, ResourceConflict, ResourceNotFound
from app.core.security.authorization.evaluator import AuthorizationContext
from app.core.security.authorization.permissions.catalog import Permission
from app.domain.documents.models.category import DocumentCategory
from app.domain.documents.models.document import Document
from app.domain.documents.schemas.vault import CategoryCreate, CategoryNode, CategoryUpdate


def _assert_may_manage(context: AuthorizationContext, department_id: UUID | None) -> None:
    if not context.has(Permission.DOCUMENTS_MANAGE_CATEGORIES, department_id=department_id):
        raise PermissionDenied(
            message_en="You cannot reorganize file categories here.",
            message_zh="你没有整理该处文件分类的权限。",
        )


async def build_tree(
    session: AsyncSession,
    context: AuthorizationContext,
    *,
    department_id: UUID | None = None,
) -> list[CategoryNode]:
    """Nested categories for one department, with per-category document counts."""
    if not context.has(Permission.DOCUMENTS_VIEW):
        raise PermissionDenied(
            message_en="You do not have access to the document vault.",
            message_zh="你没有访问文件库的权限。",
        )

    statement = select(DocumentCategory).order_by(
        DocumentCategory.sort_order.asc(), DocumentCategory.name_zh.asc()
    )
    if department_id is not None:
        statement = statement.where(
            (DocumentCategory.department_id == department_id)
            | (DocumentCategory.department_id.is_(None))
        )
    categories = (await session.execute(statement)).scalars().all()

    count_rows = await session.execute(
        select(Document.category_id, func.count())
        .where(Document.archived_at.is_(None))
        .group_by(Document.category_id)
    )
    counts = dict(count_rows.all())

    nodes: dict[UUID, CategoryNode] = {
        category.id: CategoryNode(
            id=category.id,
            slug=category.slug,
            name_en=category.name_en,
            name_zh=category.name_zh,
            description=category.description,
            kind=category.kind,
            department_id=category.department_id,
            parent_id=category.parent_id,
            is_system_managed=category.is_system_managed,
            sort_order=category.sort_order,
            document_count=counts.get(category.id, 0),
            children=[],
        )
        for category in categories
    }

    roots: list[CategoryNode] = []
    for node in nodes.values():
        parent = nodes.get(node.parent_id) if node.parent_id else None
        if parent is None:
            roots.append(node)
        else:
            parent.children.append(node)
    return roots


async def create_category(
    session: AsyncSession, context: AuthorizationContext, payload: CategoryCreate
) -> CategoryNode:
    _assert_may_manage(context, payload.department_id)

    if payload.parent_id is not None:
        parent = await session.get(DocumentCategory, payload.parent_id)
        if parent is None:
            raise ResourceNotFound(
                message_en="The parent category could not be found.",
                message_zh="未找到上级分类。",
            )
        if parent.department_id != payload.department_id:
            raise ResourceConflict(
                message_en="A category must sit in the same department as its parent.",
                message_zh="子分类必须与上级分类属于同一部门。",
            )

    category = DocumentCategory(
        slug=payload.slug,
        name_en=payload.name_en,
        name_zh=payload.name_zh,
        description=payload.description,
        kind=payload.kind,
        department_id=payload.department_id,
        parent_id=payload.parent_id,
        sort_order=payload.sort_order,
    )
    session.add(category)
    await session.flush()
    return _to_node(category)


async def update_category(
    session: AsyncSession,
    context: AuthorizationContext,
    category_id: UUID,
    payload: CategoryUpdate,
) -> CategoryNode:
    category = await _require_category(session, category_id)
    _assert_may_manage(context, category.department_id)

    changes = payload.model_dump(exclude_unset=True)
    if changes.get("parent_id") == category.id:
        raise ResourceConflict(
            message_en="A category cannot be its own parent.",
            message_zh="分类不能把自己设为上级分类。",
        )

    for field_name, value in changes.items():
        setattr(category, field_name, value)
    await session.flush()
    return _to_node(category)


async def delete_category(
    session: AsyncSession, context: AuthorizationContext, category_id: UUID
) -> None:
    category = await _require_category(session, category_id)
    _assert_may_manage(context, category.department_id)

    if category.is_system_managed:
        raise ResourceConflict(
            message_en="Built-in categories can be renamed but not deleted.",
            message_zh="内置分类可以重命名，但不能删除。",
        )

    document_count = (
        await session.execute(
            select(func.count()).select_from(Document).where(Document.category_id == category.id)
        )
    ).scalar_one()
    if document_count:
        raise ResourceConflict(
            message_en=f"This category still holds {document_count} file(s).",
            message_zh=f"该分类下仍有 {document_count} 个文件，请先移动或删除。",
            details={"document_count": document_count},
        )

    await session.delete(category)
    await session.flush()


def _to_node(category: DocumentCategory) -> CategoryNode:
    return CategoryNode(
        id=category.id,
        slug=category.slug,
        name_en=category.name_en,
        name_zh=category.name_zh,
        description=category.description,
        kind=category.kind,
        department_id=category.department_id,
        parent_id=category.parent_id,
        is_system_managed=category.is_system_managed,
        sort_order=category.sort_order,
        document_count=0,
        children=[],
    )


async def _require_category(session: AsyncSession, category_id: UUID) -> DocumentCategory:
    category = await session.get(DocumentCategory, category_id)
    if category is None:
        raise ResourceNotFound(
            message_en="That category could not be found.",
            message_zh="未找到该分类。",
        )
    return category
