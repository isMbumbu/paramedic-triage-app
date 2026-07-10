"""Business services for triage workflows."""

from uuid import UUID

import structlog

from app.core.exceptions import NotFoundError
from app.models.triage import TriageRecord, TriageStatus
from app.repositories.triage import TriageRepository
from app.schemas.triage import SortDirection, SortField, TriageCreate, TriageUpdate

logger = structlog.get_logger(__name__)


class TriageService:
    """Application service coordinating triage record use cases."""

    def __init__(self, repository: TriageRepository) -> None:
        """Initialize the service with a triage repository."""

        self.repository = repository

    async def create_record(self, payload: TriageCreate) -> TriageRecord:
        """Create and persist a triage record."""

        record = await self.repository.create(payload)
        logger.info(
            "triage_record_created",
            record_id=str(record.id),
            priority=record.priority,
            status=record.status.value,
        )
        return record

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
        """List triage records using caller-provided filters and pagination."""

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
        """Return one triage record or raise a domain not-found error."""

        record = await self.repository.get(record_id)
        if record is None:
            logger.warning("triage_record_not_found", record_id=str(record_id))
            raise NotFoundError("Triage record")
        return record

    async def update_record(self, record_id: UUID, payload: TriageUpdate) -> TriageRecord:
        """Update a triage record after confirming it exists."""

        record = await self.get_record(record_id)
        return await self.repository.update(record, payload)

    async def delete_record(self, record_id: UUID) -> None:
        """Delete a triage record after confirming it exists."""

        record = await self.get_record(record_id)
        await self.repository.delete(record)
