from datetime import datetime
from typing import Generic, Literal, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.triage import TriageStatus

SortField = Literal["created_at", "updated_at", "priority", "patient_name", "status"]
SortDirection = Literal["asc", "desc"]
T = TypeVar("T")


class TriageCreate(BaseModel):
    patient_name: str = Field(min_length=1, max_length=160)
    condition_description: str = Field(min_length=1, max_length=5000)
    priority: int = Field(ge=1, le=5)
    status: TriageStatus
    synced: bool = True

    model_config = ConfigDict(str_strip_whitespace=True)


class TriageUpdate(BaseModel):
    patient_name: str | None = Field(default=None, min_length=1, max_length=160)
    condition_description: str | None = Field(default=None, min_length=1, max_length=5000)
    priority: int | None = Field(default=None, ge=1, le=5)
    status: TriageStatus | None = None
    synced: bool | None = None

    model_config = ConfigDict(str_strip_whitespace=True)


class TriageRead(BaseModel):
    id: UUID
    patient_name: str
    condition_description: str
    priority: int
    status: TriageStatus
    synced: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PageMeta(BaseModel):
    page: int
    page_size: int
    total: int


class TriageListResponse(BaseModel):
    data: list[TriageRead]
    meta: PageMeta


class ApiResponse(BaseModel, Generic[T]):
    data: T
