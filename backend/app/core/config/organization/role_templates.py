"""Pre-built permission sets offered to the presidium as one-click starting points.

The admin console presents these as named cards ("what can this person do?") instead of raw
permission identifiers. Templates are seeded as regular roles, so they can be edited or extended
afterwards without touching code.

面向主席团的预置权限集合，管理后台以「这个人能做什么」的卡片形式呈现，而非罗列权限标识。
模板以普通角色形式写入数据库，后续可直接编辑或扩展，无需改动代码。
"""

from __future__ import annotations

from dataclasses import dataclass

from app.core.security.authorization.permissions.catalog import Permission
from app.core.security.authorization.scopes import GrantScope


@dataclass(frozen=True, slots=True)
class RoleTemplate:
    """A named permission bundle with the scope its grants apply to."""

    key: str
    name_en: str
    name_zh: str
    description_en: str
    description_zh: str
    scope: GrantScope
    permissions: tuple[Permission, ...]
    sort_order: int = 0


_DEPARTMENT_MEMBER_PERMISSIONS: tuple[Permission, ...] = (
    Permission.DIRECTORY_VIEW,
    Permission.DOCUMENTS_VIEW,
    Permission.DOCUMENTS_UPLOAD,
    Permission.EVENTS_VIEW,
    Permission.ALUMNI_VIEW,
)

_DEPARTMENT_LEAD_PERMISSIONS: tuple[Permission, ...] = (
    *_DEPARTMENT_MEMBER_PERMISSIONS,
    Permission.DIRECTORY_VIEW_CONTACT_DETAILS,
    Permission.DIRECTORY_EXPORT,
    Permission.DOCUMENTS_EDIT,
    Permission.DOCUMENTS_DELETE,
    Permission.DOCUMENTS_MANAGE_CATEGORIES,
    Permission.EVENTS_CREATE,
    Permission.EVENTS_EDIT,
    Permission.NOTIFICATIONS_SEND_DEPARTMENT,
)


ROLE_TEMPLATES: tuple[RoleTemplate, ...] = (
    RoleTemplate(
        key="department_member",
        name_en="Department Member",
        name_zh="部门成员",
        description_en="Reads the department roster, opens shared files, and uploads their own work.",
        description_zh="查看本部门名单、打开共享文件并上传自己的成果。",
        scope=GrantScope.DEPARTMENT,
        permissions=_DEPARTMENT_MEMBER_PERMISSIONS,
        sort_order=10,
    ),
    RoleTemplate(
        key="department_officer",
        name_en="Department Officer",
        name_zh="部门干事",
        description_en="Everything a member can do, plus drafting activities and tidying files.",
        description_zh="在部门成员基础上，可起草活动并整理文件。",
        scope=GrantScope.DEPARTMENT,
        permissions=(
            *_DEPARTMENT_MEMBER_PERMISSIONS,
            Permission.DOCUMENTS_EDIT,
            Permission.EVENTS_CREATE,
        ),
        sort_order=20,
    ),
    RoleTemplate(
        key="department_lead",
        name_en="Department Lead",
        name_zh="部长 / 副部长",
        description_en="Runs the department: manages its files, activities, and internal emails.",
        description_zh="负责部门运转：管理本部门文件、活动与内部邮件。",
        scope=GrantScope.DEPARTMENT,
        permissions=_DEPARTMENT_LEAD_PERMISSIONS,
        sort_order=30,
    ),
    RoleTemplate(
        key="executive",
        name_en="Presidium Executive",
        name_zh="主席团成员",
        description_en="Oversees every department, approves registrations, and assigns permissions.",
        description_zh="监管所有部门，审批注册申请并分配权限。",
        scope=GrantScope.ORGANIZATION,
        permissions=(
            *_DEPARTMENT_LEAD_PERMISSIONS,
            Permission.DIRECTORY_VIEW_ALL_DEPARTMENTS,
            Permission.DIRECTORY_EDIT_ANY_PROFILE,
            Permission.DOCUMENTS_VIEW_ALL_DEPARTMENTS,
            Permission.EVENTS_PUBLISH,
            Permission.EVENTS_DELETE,
            Permission.ALUMNI_MANAGE,
            Permission.NOTIFICATIONS_SEND_ORGANIZATION,
            Permission.ADMIN_REVIEW_REGISTRATIONS,
            Permission.ADMIN_ASSIGN_DEPARTMENTS,
            Permission.ADMIN_MANAGE_ROLES,
            Permission.ADMIN_DEACTIVATE_ACCOUNTS,
            Permission.ADMIN_VIEW_AUDIT_LOG,
        ),
        sort_order=40,
    ),
    RoleTemplate(
        key="alumnus",
        name_en="Alumnus",
        name_zh="毕业生校友",
        description_en="Keeps access to the alumni network and public activities after graduation.",
        description_zh="毕业后保留校友网络与公开活动的访问权限。",
        scope=GrantScope.DEPARTMENT,
        permissions=(
            Permission.ALUMNI_VIEW,
            Permission.EVENTS_VIEW,
            Permission.DOCUMENTS_VIEW,
        ),
        sort_order=50,
    ),
    RoleTemplate(
        key="platform_administrator",
        name_en="Platform Administrator",
        name_zh="平台管理员",
        description_en="Full technical control, including departments, roles, and platform settings.",
        description_zh="完整技术控制权，含部门、角色与平台设置。",
        scope=GrantScope.ORGANIZATION,
        permissions=tuple(Permission),
        sort_order=60,
    ),
)


ROLE_TEMPLATES_BY_KEY: dict[str, RoleTemplate] = {
    template.key: template for template in ROLE_TEMPLATES
}

PLATFORM_ADMINISTRATOR_ROLE_KEY = "platform_administrator"
