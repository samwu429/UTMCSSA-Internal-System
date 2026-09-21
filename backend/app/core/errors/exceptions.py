"""Application-level error types translated into HTTP responses at the API boundary.

Services raise these instead of ``HTTPException`` so domain logic stays independent of the web
framework, and so every error carries a stable machine-readable code plus a bilingual message the
frontend can display without maintaining its own translation table.

服务层抛出这些异常而非 HTTPException，使领域逻辑与 Web 框架解耦；每个异常都带有稳定的机器可读码与
中英双语文案，前端无需自行维护翻译表。
"""

from __future__ import annotations


class ApplicationError(Exception):
    """Base class for expected failures that map to a client-visible response."""

    status_code: int = 400
    code: str = "application_error"

    def __init__(self, message_en: str, message_zh: str, *, details: dict | None = None) -> None:
        super().__init__(message_en)
        self.message_en = message_en
        self.message_zh = message_zh
        self.details = details or {}


class ValidationFailed(ApplicationError):
    status_code = 422
    code = "validation_failed"


class AuthenticationFailed(ApplicationError):
    status_code = 401
    code = "authentication_failed"


class PermissionDenied(ApplicationError):
    status_code = 403
    code = "permission_denied"


class ResourceNotFound(ApplicationError):
    status_code = 404
    code = "resource_not_found"


class ResourceConflict(ApplicationError):
    status_code = 409
    code = "resource_conflict"


class RateLimited(ApplicationError):
    status_code = 429
    code = "rate_limited"


class ExternalServiceUnavailable(ApplicationError):
    status_code = 502
    code = "external_service_unavailable"
