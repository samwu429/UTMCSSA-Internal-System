"""Classification and visibility vocabulary for the document vault."""

from __future__ import annotations

from enum import StrEnum


class DocumentVisibility(StrEnum):
    """Who may open a document, evaluated in addition to the viewer's permissions.

    Visibility narrows access; it never widens it. A document marked ``ORGANIZATION`` is still
    invisible to someone lacking the permission to read documents at all.

    可见性只做收窄，不做放宽。标记为 ORGANIZATION 的文件，对完全没有文件读取权限的人依然不可见。
    """

    DEPARTMENT = "department"
    ORGANIZATION = "organization"
    PRESIDIUM_ONLY = "presidium_only"


class DocumentKind(StrEnum):
    """Top-level classification the association uses when filing paperwork.

    Mirrors how the club already thinks about its files: governance paperwork on one side, activity
    planning material on the other.

    对应社团现有的归档习惯：一侧是治理类行政文件，另一侧是活动策划材料。
    """

    GOVERNANCE = "governance"
    PLANNING = "planning"
    FINANCE = "finance"
    SPONSORSHIP = "sponsorship"
    PUBLICITY = "publicity"
    ACADEMIC = "academic"
    ARCHIVE = "archive"
