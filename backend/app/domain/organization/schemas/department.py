"""Department administration payloads."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DepartmentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name_en: str
    name_zh: str
    summary_en: str | None = None
    summary_zh: str | None = None
    accent_color: str
    portal_modules: list[str]
    has_organization_oversight: bool
    is_active: bool
    sort_order: int
    parent_id: UUID | None = None


class DepartmentWithHeadcount(DepartmentSummary):
    """Summary plus the roster size shown on the presidium's oversight dashboard."""

    member_count: int = 0
    pending_count: int = 0


class DepartmentCreate(BaseModel):
    slug: str = Field(min_length=2, max_length=64, pattern="^[a-z0-9][a-z0-9-]*$")
    name_en: str = Field(min_length=1, max_length=120)
    name_zh: str = Field(min_length=1, max_length=120)
    summary_en: str | None = Field(default=None, max_length=1000)
    summary_zh: str | None = Field(default=None, max_length=1000)
    accent_color: str = Field(default="#2C3E50", pattern="^#[0-9A-Fa-f]{6}$")
    portal_modules: list[str] = Field(default_factory=list)
    has_organization_oversight: bool = False
    parent_id: UUID | None = None
    sort_order: int = 0


class DepartmentUpdate(BaseModel):
    name_en: str | None = Field(default=None, min_length=1, max_length=120)
    name_zh: str | None = Field(default=None, min_length=1, max_length=120)
    summary_en: str | None = Field(default=None, max_length=1000)
    summary_zh: str | None = Field(default=None, max_length=1000)
    accent_color: str | None = Field(default=None, pattern="^#[0-9A-Fa-f]{6}$")
    portal_modules: list[str] | None = None
    has_organization_oversight: bool | None = None
    is_active: bool | None = None
    parent_id: UUID | None = None
    sort_order: int | None = None
