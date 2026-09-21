"""Single import surface that guarantees every mapper is registered.

SQLAlchemy resolves string-based relationship targets only once all mapped classes have been
imported. Alembic autogeneration has the same requirement. Importing this module - and nothing
else - satisfies both.

SQLAlchemy 仅在所有映射类均已导入后才能解析字符串形式的关系目标，Alembic 自动生成迁移同样如此。
只需导入本模块即可同时满足两者。
"""

from __future__ import annotations

from app.domain.academics.models.course_enrolment import CourseEnrolment
from app.domain.activities.models.activity import Activity
from app.domain.activities.models.announcement import Announcement
from app.domain.audit.models.audit_log_entry import AuditLogEntry
from app.domain.directory.models.alumni_profile import AlumniProfile
from app.domain.documents.models.category import DocumentCategory
from app.domain.documents.models.document import Document, DocumentVersion
from app.domain.identity.models.email_verification_code import EmailVerificationCode
from app.domain.identity.models.refresh_session import RefreshSession
from app.domain.identity.models.user_account import UserAccount
from app.domain.notifications.models.email_delivery_log import EmailDeliveryLog
from app.domain.organization.models.department import Department
from app.domain.organization.models.membership import DepartmentMembership
from app.domain.organization.models.role import Role, RolePermission
from app.infrastructure.database.base import Base

__all__ = [
    "Activity",
    "AlumniProfile",
    "Announcement",
    "AuditLogEntry",
    "Base",
    "CourseEnrolment",
    "Department",
    "DepartmentMembership",
    "Document",
    "DocumentCategory",
    "DocumentVersion",
    "EmailDeliveryLog",
    "EmailVerificationCode",
    "RefreshSession",
    "Role",
    "RolePermission",
    "UserAccount",
]
