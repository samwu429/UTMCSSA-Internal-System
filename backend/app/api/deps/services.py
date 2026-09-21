"""Dependencies that supply infrastructure collaborators to route handlers."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from app.infrastructure.email.dispatcher import EmailDispatcher
from app.infrastructure.storage.base import DocumentStorage
from app.infrastructure.storage.factory import get_document_storage


def provide_email_dispatcher() -> EmailDispatcher:
    return EmailDispatcher()


def provide_document_storage() -> DocumentStorage:
    return get_document_storage()


DispatcherDependency = Annotated[EmailDispatcher, Depends(provide_email_dispatcher)]
StorageDependency = Annotated[DocumentStorage, Depends(provide_document_storage)]
