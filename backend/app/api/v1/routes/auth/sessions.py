"""Sign-in, token refresh, and sign-out endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Request, status

from app.api.deps.authentication import (
    AccountDependency,
    SessionDependency,
    client_address,
)
from app.domain.identity.schemas.authentication import (
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    TokenPair,
)
from app.domain.identity.services import authentication_service

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=TokenPair)
async def sign_in(
    payload: LoginRequest,
    request: Request,
    session: SessionDependency,
) -> TokenPair:
    _, tokens = await authentication_service.sign_in(
        session,
        email=str(payload.email),
        password=payload.password,
        user_agent=request.headers.get("user-agent"),
        ip_address=client_address(request),
    )
    return tokens


@router.post("/refresh", response_model=TokenPair)
async def refresh_session(
    payload: RefreshRequest,
    request: Request,
    session: SessionDependency,
) -> TokenPair:
    _, tokens = await authentication_service.refresh(
        session,
        refresh_token=payload.refresh_token,
        user_agent=request.headers.get("user-agent"),
        ip_address=client_address(request),
    )
    return tokens


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def sign_out(
    payload: LogoutRequest,
    account: AccountDependency,
    session: SessionDependency,
) -> None:
    await authentication_service.sign_out(
        session,
        user_id=account.id,
        refresh_token=payload.refresh_token,
        all_sessions=payload.all_sessions,
    )
