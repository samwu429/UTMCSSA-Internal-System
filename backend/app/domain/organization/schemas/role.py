"""Permission set administration payloads.

Shapes here are written for the admin console rather than for an API client: permissions arrive
already grouped and described in both languages so the interface can render checkboxes without
holding its own copy of the catalog.

这些结构面向管理后台而非通用 API 客户端：权限已按组分好并附中英文说明，
界面据此直接渲染勾选框，无需自行维护一份权限目录副本。
"""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.security.authorization.scopes import GrantScope


class PermissionOption(BaseModel):
    """One checkbox in the permission editor."""

    value: str
    label_en: str
    label_zh: str


class PermissionGroupView(BaseModel):
    """A labelled section of the permission editor."""

    key: str
    label_en: str
    label_zh: str
    options: list[PermissionOption]


class PermissionCatalog(BaseModel):
    """Everything the admin console needs to render the permission editor."""

    groups: list[PermissionGroupView]


class RoleSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    key: str | None = None
    name_en: str
    name_zh: str
    description_en: str | None = None
    description_zh: str | None = None
    scope: GrantScope
    department_id: UUID | None = None
    is_system_managed: bool
    sort_order: int
    permission_count: int = 0
    assigned_member_count: int = 0


class RoleDetail(RoleSummary):
    permissions: list[str] = Field(default_factory=list)


class RoleCreate(BaseModel):
    name_en: str = Field(min_length=1, max_length=120)
    name_zh: str = Field(min_length=1, max_length=120)
    description_en: str | None = Field(default=None, max_length=1000)
    description_zh: str | None = Field(default=None, max_length=1000)
    scope: GrantScope = GrantScope.DEPARTMENT
    department_id: UUID | None = None
    permissions: list[str] = Field(default_factory=list)
    sort_order: int = 0


class RoleUpdate(BaseModel):
    name_en: str | None = Field(default=None, min_length=1, max_length=120)
    name_zh: str | None = Field(default=None, min_length=1, max_length=120)
    description_en: str | None = Field(default=None, max_length=1000)
    description_zh: str | None = Field(default=None, max_length=1000)
    scope: GrantScope | None = None
    permissions: list[str] | None = None
    sort_order: int | None = None


class MembershipAssignment(BaseModel):
    """Place an account in a department with a given permission set."""

    user_id: UUID
    department_id: UUID
    role_id: UUID
    is_primary: bool = False
    title_en: str | None = Field(default=None, max_length=120)
    title_zh: str | None = Field(default=None, max_length=120)
    term_label: str | None = Field(default=None, max_length=32)


class MembershipUpdate(BaseModel):
    role_id: UUID | None = None
    is_primary: bool | None = None
    title_en: str | None = Field(default=None, max_length=120)
    title_zh: str | None = Field(default=None, max_length=120)
    term_label: str | None = Field(default=None, max_length=32)
