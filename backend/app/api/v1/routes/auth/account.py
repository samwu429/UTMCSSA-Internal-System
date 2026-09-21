"""Endpoints the signed-in member uses to inspect and adjust their own account."""

from __future__ import annotations

from fastapi import APIRouter, status

from app.api.deps.authentication import AccountDependency, SessionDependency
from app.domain.directory.schemas.member import NotificationPreferenceUpdate
from app.domain.identity.schemas.authentication import PasswordChangeRequest
from app.domain.identity.schemas.session_profile import SessionProfile
from app.domain.identity.services import (
    authentication_service,
    authorization_context_loader,
    session_profile_service,
)

router = APIRouter(prefix="/auth/me", tags=["account"])


@router.get("", response_model=SessionProfile)
async def read_profile(account: AccountDependency) -> SessionProfile:
    context = authorization_context_loader.build_context(account)
    return session_profile_service.build(account, context)


@router.post("/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: PasswordChangeRequest,
    account: AccountDependency,
    session: SessionDependency,
) -> None:
    await authentication_service.change_password(
        session,
        account=account,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )


@router.patch("/preferences", response_model=SessionProfile)
async def update_preferences(
    payload: NotificationPreferenceUpdate,
    account: AccountDependency,
    session: SessionDependency,
) -> SessionProfile:
    for field_name, value in payload.model_dump(exclude_unset=True).items():
        setattr(account, field_name, value)
    await session.flush()

    context = authorization_context_loader.build_context(account)
    return session_profile_service.build(account, context)
