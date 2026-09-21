"""Credential exchange and session lifecycle payloads."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class TokenPair(BaseModel):
    """Issued on sign-in and on every refresh.

    ``landing_path`` is computed server-side from the member's primary department so the browser
    never has to infer where a given account belongs.

    landing_path 由服务端依据成员主归属部门计算，浏览器无需自行推断账号应进入哪个门户。
    """

    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    access_token_expires_at: datetime
    refresh_token_expires_at: datetime
    landing_path: str


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class LogoutRequest(BaseModel):
    refresh_token: str | None = None
    # Ends every session rather than only the one presenting the token.
    # 结束该账号的全部会话，而非仅当前令牌对应的会话。
    all_sessions: bool = False


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirmation(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=12)
    new_password: str = Field(min_length=10, max_length=128)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=10, max_length=128)
