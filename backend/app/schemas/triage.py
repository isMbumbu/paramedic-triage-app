"""Pydantic schemas used for triage API validation and serialization."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.triage import TriageStatus

SortField = Literal["created_at", "updated_at", "priority", "patient_name", "status"]
SortDirection = Literal["asc", "desc"]


class TriageCreate(BaseModel):
    """Payload accepted when creating a triage record."""

    patient_name: str = Field(
        min_length=1,
        max_length=160,
        examples=["Amina Otieno"],
        description="Patient name or field identifier when the name is unknown.",
    )
    condition_description: str = Field(
        min_length=1,
        max_length=5000,
        examples=["Severe chest pain with shortness of breath."],
        description="Clinical description captured by the field paramedic.",
    )
    priority: int = Field(
        ge=1,
        le=5,
        examples=[1],
        description="Triage priority from 1 to 5; 1 is life-threatening.",
    )
    status: TriageStatus = Field(description="Current transport workflow state.")
    synced: bool = Field(
        default=True,
        description="Whether the source client considers the record synchronized.",
    )

    model_config = ConfigDict(str_strip_whitespace=True)


class TriageUpdate(BaseModel):
    """Partial payload accepted when updating a triage record."""

    patient_name: str | None = Field(default=None, min_length=1, max_length=160)
    condition_description: str | None = Field(
        default=None,
        min_length=1,
        max_length=5000,
    )
    priority: int | None = Field(default=None, ge=1, le=5)
    status: TriageStatus | None = None
    synced: bool | None = None

    model_config = ConfigDict(str_strip_whitespace=True)


class TriageRead(BaseModel):
    """Triage record returned by the API."""

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
    """Pagination metadata returned with collection responses."""

    page: int
    page_size: int
    total: int


class TriageQueryParams(BaseModel):
    """Reusable query parameters for triage list filtering and sorting."""

    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=25, ge=1, le=100)
    priority: int | None = Field(default=None, ge=1, le=5)
    status: TriageStatus | None = None
    synced: bool | None = None
    sort_by: SortField = "created_at"
    sort_direction: SortDirection = "desc"


class TriageListResponse(BaseModel):
    """Paginated triage record list response."""

    data: list[TriageRead]
    meta: PageMeta


class ApiResponse[T](BaseModel):
    """Consistent envelope for single-resource responses."""

    data: T
