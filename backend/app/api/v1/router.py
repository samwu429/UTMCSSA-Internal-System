"""Aggregation of every version-one route module.

Ordering matters only where a literal path could be captured by a parameterized one; the account
routes are mounted before the session routes for that reason.

仅在字面量路径可能被参数化路径吞掉时顺序才重要；账号路由先于会话路由挂载即出于此。
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.routes.academics import timetable
from app.api.v1.routes.activities import calendar
from app.api.v1.routes.auth import account, registration, sessions
from app.api.v1.routes.directory import alumni, members
from app.api.v1.routes.documents import vault
from app.api.v1.routes.notifications import messaging
from app.api.v1.routes.organization import administration, departments, roles

api_router = APIRouter()

api_router.include_router(account.router)
api_router.include_router(registration.router)
api_router.include_router(sessions.router)
api_router.include_router(members.router)
api_router.include_router(alumni.router)
api_router.include_router(departments.router)
api_router.include_router(roles.router)
api_router.include_router(administration.router)
api_router.include_router(vault.router)
api_router.include_router(calendar.router)
api_router.include_router(timetable.router)
api_router.include_router(messaging.router)
