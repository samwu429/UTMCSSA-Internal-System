"""Scope vocabulary that bounds where a permission grant applies.

A grant is never "global" by accident: an organization-scoped grant is an explicit decision made by
the presidium, while a department-scoped grant is confined to the department the membership points
at. Keeping the distinction in one place prevents privilege leaks across department portals.

限定权限生效范围的作用域定义。组织级授权必须由主席团显式授予，部门级授权仅在成员所属部门内生效。
将该区分集中于一处，可避免权限跨部门门户泄漏。
"""

from __future__ import annotations

from enum import StrEnum


class GrantScope(StrEnum):
    """Breadth of a permission grant."""

    # Applies only within the department attached to the membership carrying the role.
    # 仅在承载该角色的成员关系所指向的部门内生效。
    DEPARTMENT = "department"

    # Applies across every department; reserved for the presidium and platform administrators.
    # 跨所有部门生效；保留给主席团与平台管理员。
    ORGANIZATION = "organization"
