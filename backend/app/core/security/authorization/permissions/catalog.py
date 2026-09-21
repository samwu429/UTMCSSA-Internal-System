"""Canonical permission identifiers and their human-readable descriptions.

Permissions are the only authorization primitive in the system. Roles are named bundles of these
identifiers, and every API route asserts a permission rather than a role name, so the presidium can
reshape roles without code changes.

权限标识是系统唯一的授权原语。角色是权限的命名集合，所有 API 仅校验权限而非角色名，
因此主席团可以在不改代码的前提下自由调整角色。
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class Permission(StrEnum):
    """Every action the platform can authorize, namespaced by the resource it affects."""

    DIRECTORY_VIEW = "directory.view"
    DIRECTORY_VIEW_ALL_DEPARTMENTS = "directory.view_all_departments"
    DIRECTORY_VIEW_CONTACT_DETAILS = "directory.view_contact_details"
    DIRECTORY_EDIT_ANY_PROFILE = "directory.edit_any_profile"
    DIRECTORY_EXPORT = "directory.export"

    ALUMNI_VIEW = "alumni.view"
    ALUMNI_MANAGE = "alumni.manage"

    DOCUMENTS_VIEW = "documents.view"
    DOCUMENTS_UPLOAD = "documents.upload"
    DOCUMENTS_EDIT = "documents.edit"
    DOCUMENTS_DELETE = "documents.delete"
    DOCUMENTS_MANAGE_CATEGORIES = "documents.manage_categories"
    DOCUMENTS_VIEW_ALL_DEPARTMENTS = "documents.view_all_departments"

    EVENTS_VIEW = "events.view"
    EVENTS_CREATE = "events.create"
    EVENTS_EDIT = "events.edit"
    EVENTS_DELETE = "events.delete"
    EVENTS_PUBLISH = "events.publish"

    NOTIFICATIONS_SEND_DEPARTMENT = "notifications.send_department"
    NOTIFICATIONS_SEND_ORGANIZATION = "notifications.send_organization"

    ADMIN_REVIEW_REGISTRATIONS = "admin.review_registrations"
    ADMIN_ASSIGN_DEPARTMENTS = "admin.assign_departments"
    ADMIN_MANAGE_ROLES = "admin.manage_roles"
    ADMIN_MANAGE_DEPARTMENTS = "admin.manage_departments"
    ADMIN_DEACTIVATE_ACCOUNTS = "admin.deactivate_accounts"
    ADMIN_VIEW_AUDIT_LOG = "admin.view_audit_log"

    SYSTEM_MANAGE_SETTINGS = "system.manage_settings"


@dataclass(frozen=True, slots=True)
class PermissionGroup:
    """A presentation grouping so the admin console can render permissions as plain checkboxes."""

    key: str
    label_en: str
    label_zh: str
    permissions: tuple[Permission, ...]


# Wording is aimed at non-technical presidium members operating the admin console; it must read as
# a description of a capability, not of an endpoint.
# 措辞面向非技术主席团成员，应描述"能做什么"而非接口名称。
PERMISSION_DESCRIPTIONS: dict[Permission, tuple[str, str]] = {
    Permission.DIRECTORY_VIEW: (
        "View the member list of their own department",
        "查看本部门成员名单",
    ),
    Permission.DIRECTORY_VIEW_ALL_DEPARTMENTS: (
        "View the member list of every department",
        "查看全社团所有部门的成员名单",
    ),
    Permission.DIRECTORY_VIEW_CONTACT_DETAILS: (
        "See email addresses and phone numbers in the member list",
        "在成员名单中查看邮箱与电话",
    ),
    Permission.DIRECTORY_EDIT_ANY_PROFILE: (
        "Correct another member's profile information",
        "修改其他成员的档案信息",
    ),
    Permission.DIRECTORY_EXPORT: (
        "Export the member list as a spreadsheet",
        "将成员名单导出为表格",
    ),
    Permission.ALUMNI_VIEW: (
        "Browse the graduate and alumni network",
        "浏览毕业生与校友网络",
    ),
    Permission.ALUMNI_MANAGE: (
        "Maintain alumni records and graduation years",
        "维护校友档案与毕业年份",
    ),
    Permission.DOCUMENTS_VIEW: (
        "Open files in their own department's vault",
        "查看本部门文件库中的文件",
    ),
    Permission.DOCUMENTS_UPLOAD: (
        "Upload new files and new versions",
        "上传新文件与新版本",
    ),
    Permission.DOCUMENTS_EDIT: (
        "Rename files and move them between categories",
        "重命名文件并在分类间移动",
    ),
    Permission.DOCUMENTS_DELETE: (
        "Delete files from the vault",
        "从文件库中删除文件",
    ),
    Permission.DOCUMENTS_MANAGE_CATEGORIES: (
        "Create and reorganize file categories",
        "创建与重组文件分类",
    ),
    Permission.DOCUMENTS_VIEW_ALL_DEPARTMENTS: (
        "Open files belonging to any department",
        "查看任意部门的文件",
    ),
    Permission.EVENTS_VIEW: ("View the activity calendar", "查看活动日历"),
    Permission.EVENTS_CREATE: ("Draft new activities", "创建新活动草稿"),
    Permission.EVENTS_EDIT: ("Modify existing activities", "修改已有活动"),
    Permission.EVENTS_DELETE: ("Remove activities", "删除活动"),
    Permission.EVENTS_PUBLISH: (
        "Publish an activity so members are notified",
        "发布活动并通知成员",
    ),
    Permission.NOTIFICATIONS_SEND_DEPARTMENT: (
        "Email everyone in their own department",
        "向本部门全体成员发送邮件",
    ),
    Permission.NOTIFICATIONS_SEND_ORGANIZATION: (
        "Email every member of the association",
        "向全社团成员发送邮件",
    ),
    Permission.ADMIN_REVIEW_REGISTRATIONS: (
        "Approve or reject new registration requests",
        "审批新注册申请",
    ),
    Permission.ADMIN_ASSIGN_DEPARTMENTS: (
        "Decide which department an account belongs to",
        "决定账号归属哪个部门",
    ),
    Permission.ADMIN_MANAGE_ROLES: (
        "Create permission sets and assign them to members",
        "创建权限集合并分配给成员",
    ),
    Permission.ADMIN_MANAGE_DEPARTMENTS: (
        "Add, rename, or retire departments",
        "新增、重命名或停用部门",
    ),
    Permission.ADMIN_DEACTIVATE_ACCOUNTS: (
        "Suspend accounts of members who have left",
        "停用已离任成员的账号",
    ),
    Permission.ADMIN_VIEW_AUDIT_LOG: (
        "Review the record of sensitive actions",
        "查看敏感操作记录",
    ),
    Permission.SYSTEM_MANAGE_SETTINGS: (
        "Change platform-wide settings such as email delivery",
        "修改邮件发送等平台级设置",
    ),
}


PERMISSION_GROUPS: tuple[PermissionGroup, ...] = (
    PermissionGroup(
        key="directory",
        label_en="Member Directory",
        label_zh="成员名录",
        permissions=(
            Permission.DIRECTORY_VIEW,
            Permission.DIRECTORY_VIEW_ALL_DEPARTMENTS,
            Permission.DIRECTORY_VIEW_CONTACT_DETAILS,
            Permission.DIRECTORY_EDIT_ANY_PROFILE,
            Permission.DIRECTORY_EXPORT,
        ),
    ),
    PermissionGroup(
        key="alumni",
        label_en="Alumni Network",
        label_zh="校友网络",
        permissions=(Permission.ALUMNI_VIEW, Permission.ALUMNI_MANAGE),
    ),
    PermissionGroup(
        key="documents",
        label_en="Document Vault",
        label_zh="文件库",
        permissions=(
            Permission.DOCUMENTS_VIEW,
            Permission.DOCUMENTS_UPLOAD,
            Permission.DOCUMENTS_EDIT,
            Permission.DOCUMENTS_DELETE,
            Permission.DOCUMENTS_MANAGE_CATEGORIES,
            Permission.DOCUMENTS_VIEW_ALL_DEPARTMENTS,
        ),
    ),
    PermissionGroup(
        key="events",
        label_en="Activities",
        label_zh="活动",
        permissions=(
            Permission.EVENTS_VIEW,
            Permission.EVENTS_CREATE,
            Permission.EVENTS_EDIT,
            Permission.EVENTS_DELETE,
            Permission.EVENTS_PUBLISH,
        ),
    ),
    PermissionGroup(
        key="notifications",
        label_en="Email Notifications",
        label_zh="邮件通知",
        permissions=(
            Permission.NOTIFICATIONS_SEND_DEPARTMENT,
            Permission.NOTIFICATIONS_SEND_ORGANIZATION,
        ),
    ),
    PermissionGroup(
        key="administration",
        label_en="Account Administration",
        label_zh="账号管理",
        permissions=(
            Permission.ADMIN_REVIEW_REGISTRATIONS,
            Permission.ADMIN_ASSIGN_DEPARTMENTS,
            Permission.ADMIN_MANAGE_ROLES,
            Permission.ADMIN_MANAGE_DEPARTMENTS,
            Permission.ADMIN_DEACTIVATE_ACCOUNTS,
            Permission.ADMIN_VIEW_AUDIT_LOG,
        ),
    ),
    PermissionGroup(
        key="system",
        label_en="Platform Settings",
        label_zh="平台设置",
        permissions=(Permission.SYSTEM_MANAGE_SETTINGS,),
    ),
)


def describe(permission: Permission) -> tuple[str, str]:
    """Bilingual label pair for a permission, falling back to the identifier when undocumented."""
    return PERMISSION_DESCRIPTIONS.get(permission, (permission.value, permission.value))
