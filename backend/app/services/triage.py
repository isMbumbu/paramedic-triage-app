from uuid import UUID

from app.core.exceptions import NotFoundError
from app.models.triage import TriageRecord, TriageStatus
from app.repositories.triage import TriageRepository
from app.schemas.triage import SortDirection, SortField, TriageCreate, TriageUpdate


class TriageService:
    def __init__(self, repository: TriageRepository) -> None:
        self.repository = repository

    async def create_record(self, payload: TriageCreate) -> TriageRecord:
        return await self.repository.create(payload)

    async def list_records(
        self,
        *,
        page: int,
        page_size: int,
        priority: int | None,
        status: TriageStatus | None,
        synced: bool | None,
        sort_by: SortField,
        sort_direction: SortDirection,
    ) -> tuple[list[TriageRecord], int]:
        return await self.repository.list(
            page=page,
            page_size=page_size,
            priority=priority,
            status=status,
            synced=synced,
            sort_by=sort_by,
            sort_direction=sort_direction,
        )

    async def get_record(self, record_id: UUID) -> TriageRecord:
        record = await self.repository.get(record_id)
        if record is None:
            raise NotFoundError("Triage record")
        return record

    async def update_record(self, record_id: UUID, payload: TriageUpdate) -> TriageRecord:
        record = await self.get_record(record_id)
        return await self.repository.update(record, payload)

    async def delete_record(self, record_id: UUID) -> None:
        record = await self.get_record(record_id)
        await self.repository.delete(record)
