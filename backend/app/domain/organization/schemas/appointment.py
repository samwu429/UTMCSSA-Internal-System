"""Payloads for appointing department and presidium officers."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class OfficeHolderView(BaseModel):
    user_id: UUID
    display_name: str
    membership_id: UUID


class OfficeSeatView(BaseModel):
    office_key: str
    office_name_zh: str
    office_name_en: str
    seat_limit: int
    holders: list[OfficeHolderView]
    can_appoint: bool
    can_release: bool


class DepartmentOfficeBoard(BaseModel):
    department_id: UUID
    department_slug: str
    department_name_zh: str
    department_name_en: str
    offices: list[OfficeSeatView]


class OfficeBoard(BaseModel):
    departments: list[DepartmentOfficeBoard]


class OfficeAppointment(BaseModel):
    user_id: UUID
    department_id: UUID
    office_key: str = Field(min_length=1, max_length=64)
    term_label: str | None = Field(default=None, max_length=32)
