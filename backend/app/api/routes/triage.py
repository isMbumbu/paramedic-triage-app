from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status

from app.dependencies.services import get_triage_service
from app.models.triage import TriageStatus
from app.schemas.triage import (
    ApiResponse,
    PageMeta,
    SortDirection,
    SortField,
    TriageCreate,
    TriageListResponse,
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
    return ApiResponse(data=await service.create_record(payload))


@router.get("", response_model=TriageListResponse)
async def list_triage_records(
    service: Annotated[TriageService, Depends(get_triage_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
    priority: Annotated[int | None, Query(ge=1, le=5)] = None,
    status: TriageStatus | None = None,
    synced: bool | None = None,
    sort_by: SortField = "created_at",
    sort_direction: SortDirection = "desc",
) -> TriageListResponse:
    records, total = await service.list_records(
        page=page,
        page_size=page_size,
        priority=priority,
        status=status,
        synced=synced,
        sort_by=sort_by,
        sort_direction=sort_direction,
    )
    return TriageListResponse(
        data=records,
        meta=PageMeta(page=page, page_size=page_size, total=total),
    )


@router.get("/{record_id}", response_model=ApiResponse[TriageRead])
async def get_triage_record(
    record_id: UUID,
    service: Annotated[TriageService, Depends(get_triage_service)],
) -> ApiResponse[TriageRead]:
    return ApiResponse(data=await service.get_record(record_id))


@router.patch("/{record_id}", response_model=ApiResponse[TriageRead])
async def update_triage_record(
    record_id: UUID,
    payload: TriageUpdate,
    service: Annotated[TriageService, Depends(get_triage_service)],
) -> ApiResponse[TriageRead]:
    return ApiResponse(data=await service.update_record(record_id, payload))


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_triage_record(
    record_id: UUID,
    service: Annotated[TriageService, Depends(get_triage_service)],
) -> Response:
    await service.delete_record(record_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
