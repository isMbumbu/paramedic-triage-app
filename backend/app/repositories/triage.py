"""Repository objects that isolate database access from business services."""

from typing import Any
from uuid import UUID

import structlog
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.triage import TriageRecord, TriageStatus
from app.schemas.triage import SortDirection, SortField, TriageCreate, TriageUpdate

logger = structlog.get_logger(__name__)


class TriageRepository:
    """Database gateway for triage record persistence."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize the repository with a request-scoped database session."""

        self.session = session

    async def create(self, payload: TriageCreate) -> TriageRecord:
        """Insert a triage record and return the persisted model."""

        record = TriageRecord(**payload.model_dump())
        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
        logger.info("triage_record_inserted", record_id=str(record.id))
        return record

    async def get(self, record_id: UUID) -> TriageRecord | None:
        """Return one triage record by ID, or None when it does not exist."""

        return await self.session.get(TriageRecord, record_id)

    async def list(
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
        """Return filtered triage records and the matching total count."""

        query = self._with_filters(
            select(TriageRecord),
            priority=priority,
            status=status,
            synced=synced,
        )
        count_query = self._with_filters(
            select(func.count()).select_from(TriageRecord),
            priority=priority,
            status=status,
            synced=synced,
        )
        sort_column = getattr(TriageRecord, sort_by)
        if sort_direction == "desc":
            sort_column = sort_column.desc()

        result = await self.session.scalars(
            query.order_by(sort_column).offset((page - 1) * page_size).limit(page_size)
        )
        total = await self.session.scalar(count_query)
        return list(result), int(total or 0)

    async def update(self, record: TriageRecord, payload: TriageUpdate) -> TriageRecord:
        """Apply a partial update to an existing triage record."""

        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(record, key, value)
        await self.session.commit()
        await self.session.refresh(record)
        logger.info("triage_record_updated", record_id=str(record.id))
        return record

    async def delete(self, record: TriageRecord) -> None:
        """Delete an existing triage record."""

        await self.session.delete(record)
        await self.session.commit()
        logger.info("triage_record_deleted", record_id=str(record.id))

    def _with_filters(
        self,
        query: Select[Any],
        *,
        priority: int | None,
        status: TriageStatus | None,
        synced: bool | None,
    ) -> Select[Any]:
        """Apply optional list filters to a SQLAlchemy select statement."""

        if priority is not None:
            query = query.where(TriageRecord.priority == priority)
        if status is not None:
            query = query.where(TriageRecord.status == status)
        if synced is not None:
            query = query.where(TriageRecord.synced == synced)
        return query
