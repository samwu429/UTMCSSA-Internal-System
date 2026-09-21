"""The bundle the frontend loads once after sign-in to render the correct portal.

One request returns identity, department memberships, effective permissions, and the portal
configuration of the landing department. Shipping it together is what lets the interface decide
what to show without a second round trip and without guessing at permissions.

登录后前端一次性拉取的数据包：身份、部门归属、有效权限，以及落地部门的门户配置。
合并返回使界面无需二次请求、也无需自行猜测权限即可决定展示内容。
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from app.core.security.authorization.scopes import GrantScope
from app.domain.identity.models.enums import AccountStatus, AffiliationType


class PortalConfiguration(BaseModel):
    """Everything needed to theme and populate a department's landing page."""

    model_config = ConfigDict(from_attributes=True)

    department_id: UUID
    slug: str
    name_en: str
    name_zh: str
    summary_en: str | None = None
    summary_zh: str | None = None
    accent_color: str
    portal_modules: list[str]
    has_organization_oversight: bool
    portal_path: str


class MembershipSummary(BaseModel):
    """One department affiliation as shown in the account switcher."""

    model_config = ConfigDict(from_attributes=True)

    membership_id: UUID
    department_id: UUID
    department_slug: str
    department_name_en: str
    department_name_zh: str
    department_accent_color: str
    role_id: UUID
    role_name_en: str
    role_name_zh: str
    role_scope: GrantScope
    title_en: str | None = None
    title_zh: str | None = None
    term_label: str | None = None
    is_primary: bool


class SessionProfile(BaseModel):
    """Answer to "who am I, where do I belong, and what may I do"."""

    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    email: EmailStr
    display_name: str
    legal_name: str
    chinese_name: str | None = None
    avatar_url: str | None = None
    status: AccountStatus
    affiliation: AffiliationType
    graduation_year: int | None = None
    program_of_study: str | None = None

    memberships: list[MembershipSummary]
    primary_portal: PortalConfiguration | None = None
    # Sorted permission identifiers; the frontend uses them only to hide controls the member cannot
    # use. Every action is authorized again on the server.
    # 已排序的权限标识，前端仅用于隐藏不可用控件；所有操作在服务端二次鉴权。
    permissions: list[str]

    receives_daily_digest: bool
    receives_activity_notices: bool
    preferred_language: str
    last_login_at: datetime | None = None
