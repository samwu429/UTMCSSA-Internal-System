"""Pre-built permission sets offered as named offices.

Regular departments distinguish 部长, 副部长, and 部员. The presidium has four seats. The
platform administrator bundle is seeded for the hidden technical account only.

各部门区部长、副部长与部员；主席团为四个席位。平台管理员集合仅供隐藏的技术账号使用。
"""

from __future__ import annotations

from dataclasses import dataclass

from app.core.config.organization.offices import (
    ALUMNUS_ROLE_KEY,
    DEPARTMENT_DEPUTY_ROLE_KEY,
    DEPARTMENT_DIRECTOR_ROLE_KEY,
    DEPARTMENT_MEMBER_ROLE_KEY,
    PLATFORM_ADMINISTRATOR_ROLE_KEY,
    PRESIDIUM_EXTERNAL_VP_ROLE_KEY,
    PRESIDIUM_INTERNAL_VP_ROLE_KEY,
    PRESIDIUM_PRESIDENT_ROLE_KEY,
    PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY,
)
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


_MEMBER_PERMISSIONS: tuple[Permission, ...] = (
    Permission.DIRECTORY_VIEW,
    Permission.DOCUMENTS_VIEW,
    Permission.DOCUMENTS_UPLOAD,
    Permission.EVENTS_VIEW,
    Permission.ALUMNI_VIEW,
)

_DEPUTY_PERMISSIONS: tuple[Permission, ...] = (
    *_MEMBER_PERMISSIONS,
    Permission.DIRECTORY_VIEW_CONTACT_DETAILS,
    Permission.DOCUMENTS_EDIT,
    Permission.EVENTS_CREATE,
    Permission.EVENTS_EDIT,
    Permission.NOTIFICATIONS_SEND_DEPARTMENT,
)

_DIRECTOR_PERMISSIONS: tuple[Permission, ...] = (
    *_DEPUTY_PERMISSIONS,
    Permission.DIRECTORY_EXPORT,
    Permission.DOCUMENTS_DELETE,
    Permission.DOCUMENTS_MANAGE_CATEGORIES,
    Permission.EVENTS_DELETE,
)

_SECRETARY_GENERAL_PERMISSIONS: tuple[Permission, ...] = (
    *_MEMBER_PERMISSIONS,
    Permission.DIRECTORY_VIEW_ALL_DEPARTMENTS,
    Permission.DIRECTORY_VIEW_CONTACT_DETAILS,
    Permission.DIRECTORY_EDIT_ANY_PROFILE,
    Permission.DIRECTORY_EXPORT,
    Permission.DOCUMENTS_VIEW_ALL_DEPARTMENTS,
    Permission.DOCUMENTS_EDIT,
    Permission.DOCUMENTS_MANAGE_CATEGORIES,
    Permission.EVENTS_CREATE,
    Permission.EVENTS_EDIT,
    Permission.NOTIFICATIONS_SEND_ORGANIZATION,
    Permission.ADMIN_VIEW_AUDIT_LOG,
)

_INTERNAL_VP_PERMISSIONS: tuple[Permission, ...] = (
    *_DIRECTOR_PERMISSIONS,
    Permission.DIRECTORY_VIEW_ALL_DEPARTMENTS,
    Permission.DIRECTORY_EDIT_ANY_PROFILE,
    Permission.DOCUMENTS_VIEW_ALL_DEPARTMENTS,
    Permission.EVENTS_PUBLISH,
    Permission.NOTIFICATIONS_SEND_ORGANIZATION,
    Permission.ADMIN_MANAGE_DEPARTMENTS,
    Permission.ADMIN_DEACTIVATE_ACCOUNTS,
    Permission.ADMIN_VIEW_AUDIT_LOG,
)

_EXTERNAL_VP_PERMISSIONS: tuple[Permission, ...] = (
    *_DIRECTOR_PERMISSIONS,
    Permission.DIRECTORY_VIEW_ALL_DEPARTMENTS,
    Permission.DOCUMENTS_VIEW_ALL_DEPARTMENTS,
    Permission.EVENTS_PUBLISH,
    Permission.ALUMNI_MANAGE,
    Permission.NOTIFICATIONS_SEND_ORGANIZATION,
)

_PRESIDENT_PERMISSIONS: tuple[Permission, ...] = (
    *_DIRECTOR_PERMISSIONS,
    Permission.DIRECTORY_VIEW_ALL_DEPARTMENTS,
    Permission.DIRECTORY_EDIT_ANY_PROFILE,
    Permission.DOCUMENTS_VIEW_ALL_DEPARTMENTS,
    Permission.EVENTS_PUBLISH,
    Permission.ALUMNI_MANAGE,
    Permission.NOTIFICATIONS_SEND_ORGANIZATION,
    Permission.ADMIN_REVIEW_REGISTRATIONS,
    Permission.ADMIN_ASSIGN_DEPARTMENTS,
    Permission.ADMIN_MANAGE_ROLES,
    Permission.ADMIN_MANAGE_DEPARTMENTS,
    Permission.ADMIN_DEACTIVATE_ACCOUNTS,
    Permission.ADMIN_VIEW_AUDIT_LOG,
)


ROLE_TEMPLATES: tuple[RoleTemplate, ...] = (
    RoleTemplate(
        key=DEPARTMENT_MEMBER_ROLE_KEY,
        name_en="Department Member",
        name_zh="部员",
        description_en="Reads the department roster, opens shared files, and uploads their own work.",
        description_zh="查看本部门名单、打开共享文件并上传自己的成果。",
        scope=GrantScope.DEPARTMENT,
        permissions=_MEMBER_PERMISSIONS,
        sort_order=10,
    ),
    RoleTemplate(
        key=DEPARTMENT_DEPUTY_ROLE_KEY,
        name_en="Deputy Director",
        name_zh="副部长",
        description_en="Assists the director and admits applicants into this department as members.",
        description_zh="协助部长，并审批申请进入本部门担任部员的新成员。",
        scope=GrantScope.DEPARTMENT,
        permissions=(
            *_DEPUTY_PERMISSIONS,
            Permission.ADMIN_REVIEW_REGISTRATIONS,
            Permission.ADMIN_ASSIGN_DEPARTMENTS,
        ),
        sort_order=20,
    ),
    RoleTemplate(
        key=DEPARTMENT_DIRECTOR_ROLE_KEY,
        name_en="Director",
        name_zh="部长",
        description_en="Runs the department, appoints two deputies, and admits new members.",
        description_zh="主持本部门：任命两名副部长，并审批新成员进入本部门担任部员。",
        scope=GrantScope.DEPARTMENT,
        permissions=(
            *_DIRECTOR_PERMISSIONS,
            Permission.ADMIN_REVIEW_REGISTRATIONS,
            Permission.ADMIN_ASSIGN_DEPARTMENTS,
        ),
        sort_order=30,
    ),
    RoleTemplate(
        key=PRESIDIUM_EXTERNAL_VP_ROLE_KEY,
        name_en="External Vice President",
        name_zh="外务副主席",
        description_en="External affairs: alumni, partnerships, publishing, and association-wide mail.",
        description_zh="外务：校友与对外联络、活动发布，以及全社邮件。",
        scope=GrantScope.ORGANIZATION,
        permissions=_EXTERNAL_VP_PERMISSIONS,
        sort_order=40,
    ),
    RoleTemplate(
        key=PRESIDIUM_INTERNAL_VP_ROLE_KEY,
        name_en="Internal Vice President",
        name_zh="内务副主席",
        description_en="Internal affairs: placements, department structure, and account status.",
        description_zh="内务：成员归属、部门结构与账号状态。",
        scope=GrantScope.ORGANIZATION,
        permissions=_INTERNAL_VP_PERMISSIONS,
        sort_order=50,
    ),
    RoleTemplate(
        key=PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY,
        name_en="Secretary-General",
        name_zh="秘书长",
        description_en="Records, registrations, and the association's paper trail.",
        description_zh="文书、注册审批与全社档案流转。",
        scope=GrantScope.ORGANIZATION,
        permissions=_SECRETARY_GENERAL_PERMISSIONS,
        sort_order=60,
    ),
    RoleTemplate(
        key=PRESIDIUM_PRESIDENT_ROLE_KEY,
        name_en="President",
        name_zh="主席",
        description_en="Leads the association: appoints directors, the next president, and the presidium.",
        description_zh="主持社团：任命各部门部长、下一任主席与主席团成员。",
        scope=GrantScope.ORGANIZATION,
        permissions=_PRESIDENT_PERMISSIONS,
        sort_order=70,
    ),
    RoleTemplate(
        key=ALUMNUS_ROLE_KEY,
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
        sort_order=80,
    ),
    RoleTemplate(
        key=PLATFORM_ADMINISTRATOR_ROLE_KEY,
        name_en="Platform Administrator",
        name_zh="平台管理员",
        description_en="Hidden technical control of the platform. Not assigned to association officers.",
        description_zh="平台技术控制权，不对社团职务开放。",
        scope=GrantScope.ORGANIZATION,
        permissions=tuple(Permission),
        sort_order=90,
    ),
)


ROLE_TEMPLATES_BY_KEY: dict[str, RoleTemplate] = {
    template.key: template for template in ROLE_TEMPLATES
}
