"""HTTP routes for triage record CRUD operations."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status

from app.dependencies.services import get_triage_service
from app.schemas.triage import (
    ApiResponse,
    PageMeta,
    TriageCreate,
    TriageListResponse,
    TriageQueryParams,
    TriageRead,
    TriageUpdate,
)
from app.services.triage import TriageService

router = APIRouter(prefix="/triage", tags=["triage"])


@router.post("", response_model=ApiResponse[TriageRead], status_code=status.HTTP_201_CREATED)
async def create_triage_record(
    payload: TriageCreate,
    service: Annotated[TriageService, Depends(get_triage_service)],
) -> ApiResponse[TriageRead]:
    """Create a triage record from a mobile client submission."""

    return ApiResponse(data=await service.create_record(payload))


@router.get("", response_model=TriageListResponse)
async def list_triage_records(
    service: Annotated[TriageService, Depends(get_triage_service)],
    params: Annotated[TriageQueryParams, Depends()],
) -> TriageListResponse:
    """List triage records with pagination, filtering, and sorting."""

    records, total = await service.list_records(
        page=params.page,
        page_size=params.page_size,
        priority=params.priority,
        status=params.status,
        synced=params.synced,
        sort_by=params.sort_by,
        sort_direction=params.sort_direction,
    )
    return TriageListResponse(
        data=records,
        meta=PageMeta(page=params.page, page_size=params.page_size, total=total),
    )


@router.get("/{record_id}", response_model=ApiResponse[TriageRead])
async def get_triage_record(
    record_id: UUID,
    service: Annotated[TriageService, Depends(get_triage_service)],
) -> ApiResponse[TriageRead]:
    """Return a single triage record by ID."""

    return ApiResponse(data=await service.get_record(record_id))


@router.patch("/{record_id}", response_model=ApiResponse[TriageRead])
async def update_triage_record(
    record_id: UUID,
    payload: TriageUpdate,
    service: Annotated[TriageService, Depends(get_triage_service)],
) -> ApiResponse[TriageRead]:
    """Partially update a triage record."""

    return ApiResponse(data=await service.update_record(record_id, payload))


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_triage_record(
    record_id: UUID,
    service: Annotated[TriageService, Depends(get_triage_service)],
) -> Response:
    """Delete a triage record."""

    await service.delete_record(record_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
