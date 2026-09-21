"""The department registry that seeds the organization structure on first startup.

Each entry describes one department portal: its identity, its visual accent, and the feature
modules its landing page exposes. Departments remain editable at runtime through the admin console;
this module only provides the initial shape of the organization.

部门注册表，用于首次启动时初始化组织结构。每项描述一个部门门户：身份标识、视觉主色与落地页展示的
功能模块。部门在运行时可通过管理后台调整，本模块仅提供初始形态。
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class PortalModule(StrEnum):
    """Feature panels a department portal can surface on its landing page."""

    OVERVIEW = "overview"
    ANNOUNCEMENTS = "announcements"
    DEPARTMENT_DIRECTORY = "department_directory"
    DOCUMENT_VAULT = "document_vault"
    ACTIVITY_CALENDAR = "activity_calendar"
    SPONSOR_PIPELINE = "sponsor_pipeline"
    BUDGET_LEDGER = "budget_ledger"
    CONTENT_CALENDAR = "content_calendar"
    ACADEMIC_RESOURCES = "academic_resources"
    ALUMNI_NETWORK = "alumni_network"
    CROSS_DEPARTMENT_OVERSIGHT = "cross_department_oversight"
    ADMIN_CONSOLE = "admin_console"


@dataclass(frozen=True, slots=True)
class DepartmentBlueprint:
    """Initial definition of a department and the portal presented to its members."""

    slug: str
    name_en: str
    name_zh: str
    summary_en: str
    summary_zh: str
    accent_color: str
    modules: tuple[PortalModule, ...]
    default_role_key: str
    # Oversight departments read across the whole organization; members of a scoped department only
    # ever see their own data even though every portal is served by the same backend.
    # 监管型部门可跨部门读取数据；受限部门成员只能看到本部门数据，尽管所有门户共用同一后端。
    has_organization_oversight: bool = False
    sort_order: int = 0


_BASE_MODULES: tuple[PortalModule, ...] = (
    PortalModule.OVERVIEW,
    PortalModule.ANNOUNCEMENTS,
    PortalModule.DEPARTMENT_DIRECTORY,
    PortalModule.DOCUMENT_VAULT,
    PortalModule.ACTIVITY_CALENDAR,
)


DEPARTMENT_BLUEPRINTS: tuple[DepartmentBlueprint, ...] = (
    DepartmentBlueprint(
        slug="presidium",
        name_en="Presidium",
        name_zh="主席团",
        summary_en="Association leadership: cross-department oversight, approvals, and strategy.",
        summary_zh="社团领导层：跨部门监管、审批与整体规划。",
        accent_color="#8C1D40",
        modules=(
            *_BASE_MODULES,
            PortalModule.CROSS_DEPARTMENT_OVERSIGHT,
            PortalModule.ALUMNI_NETWORK,
            PortalModule.ADMIN_CONSOLE,
        ),
        default_role_key="executive",
        has_organization_oversight=True,
        sort_order=10,
    ),
    DepartmentBlueprint(
        slug="administration",
        name_en="Administration",
        name_zh="行政部",
        summary_en="Membership records, meeting minutes, and internal process coordination.",
        summary_zh="成员档案、会议纪要与内部流程协调。",
        accent_color="#2F4858",
        modules=(*_BASE_MODULES, PortalModule.CROSS_DEPARTMENT_OVERSIGHT),
        default_role_key="department_member",
        has_organization_oversight=True,
        sort_order=20,
    ),
    DepartmentBlueprint(
        slug="finance",
        name_en="Finance",
        name_zh="财政部",
        summary_en="Budgets, reimbursements, and financial reporting for every activity.",
        summary_zh="各项活动的预算、报销与财务报表。",
        accent_color="#1B6B4C",
        modules=(*_BASE_MODULES, PortalModule.BUDGET_LEDGER),
        default_role_key="department_member",
        sort_order=30,
    ),
    DepartmentBlueprint(
        slug="sponsorship",
        name_en="Sponsorship",
        name_zh="赞助部",
        summary_en="Sponsor outreach, partnership agreements, and deliverable tracking.",
        summary_zh="赞助商拓展、合作协议与履约跟踪。",
        accent_color="#B5651D",
        modules=(*_BASE_MODULES, PortalModule.SPONSOR_PIPELINE),
        default_role_key="department_member",
        sort_order=40,
    ),
    DepartmentBlueprint(
        slug="events",
        name_en="Events",
        name_zh="活动部",
        summary_en="Activity planning, on-site execution, and post-event review.",
        summary_zh="活动策划、现场执行与复盘总结。",
        accent_color="#C0392B",
        modules=_BASE_MODULES,
        default_role_key="department_member",
        sort_order=50,
    ),
    DepartmentBlueprint(
        slug="publicity",
        name_en="Publicity",
        name_zh="宣传部",
        summary_en="Design assets, social channels, and the publishing schedule.",
        summary_zh="设计物料、社交渠道与发布排期。",
        accent_color="#7D3C98",
        modules=(*_BASE_MODULES, PortalModule.CONTENT_CALENDAR),
        default_role_key="department_member",
        sort_order=60,
    ),
    DepartmentBlueprint(
        slug="academic",
        name_en="Academic",
        name_zh="学术部",
        summary_en="Course resources, study sessions, and academic support programmes.",
        summary_zh="课程资源、学习活动与学业支持项目。",
        accent_color="#1F618D",
        modules=(*_BASE_MODULES, PortalModule.ACADEMIC_RESOURCES),
        default_role_key="department_member",
        sort_order=70,
    ),
    DepartmentBlueprint(
        slug="alumni",
        name_en="Alumni Network",
        name_zh="毕业生校友",
        summary_en="Graduate directory, mentorship connections, and alumni events.",
        summary_zh="毕业生名录、导师对接与校友活动。",
        accent_color="#946B2D",
        modules=(
            PortalModule.OVERVIEW,
            PortalModule.ANNOUNCEMENTS,
            PortalModule.ALUMNI_NETWORK,
            PortalModule.ACTIVITY_CALENDAR,
            PortalModule.DOCUMENT_VAULT,
        ),
        default_role_key="alumnus",
        sort_order=80,
    ),
    DepartmentBlueprint(
        slug="platform-admin",
        name_en="Platform Administration",
        name_zh="管理员账户",
        summary_en="Technical operation of the platform itself: accounts, permissions, and settings.",
        summary_zh="平台自身的技术运维：账号、权限与系统设置。",
        accent_color="#2C3E50",
        modules=(
            PortalModule.OVERVIEW,
            PortalModule.ADMIN_CONSOLE,
            PortalModule.CROSS_DEPARTMENT_OVERSIGHT,
            PortalModule.DEPARTMENT_DIRECTORY,
            PortalModule.DOCUMENT_VAULT,
        ),
        default_role_key="platform_administrator",
        has_organization_oversight=True,
        sort_order=90,
    ),
)


DEPARTMENT_BLUEPRINTS_BY_SLUG: dict[str, DepartmentBlueprint] = {
    blueprint.slug: blueprint for blueprint in DEPARTMENT_BLUEPRINTS
}

# Slug of the department that receives accounts whose placement has not been decided yet.
# 尚未确定归属的账号先落在该部门。
UNASSIGNED_DEPARTMENT_SLUG = "administration"
