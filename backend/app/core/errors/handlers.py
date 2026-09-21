"""Translation of application errors into HTTP responses.

Every failure leaves the API in one envelope shape, so the frontend has exactly one place that
knows how to read an error and exactly one place that decides which language to show.

所有失败均以同一种信封结构返回，使前端只需在一处解析错误、在一处决定展示哪种语言。
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.errors.exceptions import ApplicationError

logger = logging.getLogger(__name__)


def _envelope(
    *, code: str, message_en: str, message_zh: str, details: dict | None = None
) -> dict:
    return {
        "error": {
            "code": code,
            "message_en": message_en,
            "message_zh": message_zh,
            "details": details or {},
        }
    }


def register_exception_handlers(application: FastAPI) -> None:
    @application.exception_handler(ApplicationError)
    async def _handle_application_error(
        request: Request, error: ApplicationError
    ) -> JSONResponse:
        del request
        return JSONResponse(
            status_code=error.status_code,
            content=_envelope(
                code=error.code,
                message_en=error.message_en,
                message_zh=error.message_zh,
                details=error.details,
            ),
        )

    @application.exception_handler(RequestValidationError)
    async def _handle_validation_error(
        request: Request, error: RequestValidationError
    ) -> JSONResponse:
        del request
        first = error.errors()[0] if error.errors() else {}
        field = ".".join(str(part) for part in first.get("loc", []) if part != "body")
        return JSONResponse(
            status_code=422,
            content=_envelope(
                code="validation_failed",
                message_en=f"Check the value of {field or 'the submitted data'}.",
                message_zh=f"请检查「{field or '提交内容'}」的填写。",
                details={"field": field, "reason": first.get("msg")},
            ),
        )

    @application.exception_handler(StarletteHTTPException)
    async def _handle_http_exception(
        request: Request, error: StarletteHTTPException
    ) -> JSONResponse:
        del request
        return JSONResponse(
            status_code=error.status_code,
            content=_envelope(
                code="http_error",
                message_en=str(error.detail),
                message_zh=str(error.detail),
            ),
        )

    @application.exception_handler(Exception)
    async def _handle_unexpected(request: Request, error: Exception) -> JSONResponse:
        # Internal detail stays in the log; the client receives nothing that describes the
        # implementation.
        # 内部细节仅留在日志中；返回给客户端的内容不暴露任何实现信息。
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        del error
        return JSONResponse(
            status_code=500,
            content=_envelope(
                code="internal_error",
                message_en="Something went wrong. Try again shortly.",
                message_zh="服务出现异常，请稍后重试。",
            ),
        )
