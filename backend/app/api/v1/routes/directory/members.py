"""Member directory endpoints."""

from __future__ import annotations

import csv
import io
from uuid import UUID

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.api.deps.authentication import (
    ActiveAccountDependency,
    ContextDependency,
    SessionDependency,
)
from app.core.errors.exceptions import PermissionDenied, ResourceNotFound
from app.core.security.authorization.permissions.catalog import Permission
from app.domain.directory.schemas.member import (
    MemberDetail,
    MemberPage,
    MemberProfileUpdate,
)
from app.domain.directory.services import directory_service
from app.domain.identity.models.enums import AccountStatus, AffiliationType
from app.domain.identity.services import authorization_context_loader

router = APIRouter(prefix="/members", tags=["directory"])


@router.get("", response_model=MemberPage)
async def list_members(
    session: SessionDependency,
    context: ContextDependency,
    search: str | None = None,
    department_id: UUID | None = None,
    graduation_year: int | None = None,
    affiliation: AffiliationType | None = None,
    account_status: AccountStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
) -> MemberPage:
    return await directory_service.list_members(
        session,
        context,
        search=search,
        department_id=department_id,
        graduation_year=graduation_year,
        affiliation=affiliation,
        status=account_status,
        page=page,
        page_size=page_size,
    )


@router.get("/export")
async def export_members(
    session: SessionDependency,
    context: ContextDependency,
    department_id: UUID | None = None,
) -> StreamingResponse:
    """Spreadsheet export of the roster the caller is allowed to see."""
    if not context.has(Permission.DIRECTORY_EXPORT):
        raise PermissionDenied(
            message_en="You cannot export the member directory.",
            message_zh="你没有导出成员名录的权限。",
        )

    roster = await directory_service.list_members(
        session, context, department_id=department_id, page=1, page_size=100
    )
    include_contact = context.has(Permission.DIRECTORY_VIEW_CONTACT_DETAILS)

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["姓名", "中文名", "部门", "身份", "毕业年份", "专业", "邮箱"])
    for member in roster.items:
        writer.writerow(
            [
                member.display_name,
                member.chinese_name or "",
                "、".join(badge.name_zh for badge in member.departments),
                member.affiliation.value,
                member.graduation_year or "",
                member.program_of_study or "",
                member.email if include_contact and member.email else "",
            ]
        )

    # The UTF-8 byte order mark makes Excel on Windows open the file with the correct encoding.
    # UTF-8 BOM 使 Windows 版 Excel 以正确编码打开文件。
    payload = io.BytesIO(("\ufeff" + buffer.getvalue()).encode("utf-8"))
    return StreamingResponse(
        payload,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="utmcssa-members.csv"'},
    )


@router.patch("/me", response_model=MemberDetail)
async def update_own_profile(
    payload: MemberProfileUpdate,
    account: ActiveAccountDependency,
    context: ContextDependency,
    session: SessionDependency,
) -> MemberDetail:
    directory_service.apply_profile_update(account, payload)
    await session.flush()
    return directory_service.to_detail(account, context, include_contact=True)


@router.get("/{user_id}", response_model=MemberDetail)
async def read_member(
    user_id: UUID,
    session: SessionDependency,
    context: ContextDependency,
) -> MemberDetail:
    return await directory_service.get_member(session, context, user_id)


@router.patch("/{user_id}", response_model=MemberDetail)
async def update_member(
    user_id: UUID,
    payload: MemberProfileUpdate,
    session: SessionDependency,
    context: ContextDependency,
) -> MemberDetail:
    if not context.has(Permission.DIRECTORY_EDIT_ANY_PROFILE):
        raise PermissionDenied(
            message_en="You cannot edit another member's profile.",
            message_zh="你没有修改其他成员档案的权限。",
        )

    account = await authorization_context_loader.load_account(session, user_id)
    if account is None:
        raise ResourceNotFound(
            message_en="That member could not be found.",
            message_zh="未找到该成员。",
        )

    directory_service.apply_profile_update(account, payload)
    await session.flush()
    return directory_service.to_detail(account, context, include_contact=True)
