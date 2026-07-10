from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.triage import TriageRecord, TriageStatus
from app.schemas.triage import SortDirection, SortField, TriageCreate, TriageUpdate


class TriageRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, payload: TriageCreate) -> TriageRecord:
        record = TriageRecord(**payload.model_dump())
        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
        return record

    async def get(self, record_id: UUID) -> TriageRecord | None:
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
        return list(result), total or 0

    async def update(self, record: TriageRecord, payload: TriageUpdate) -> TriageRecord:
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(record, key, value)
        await self.session.commit()
        await self.session.refresh(record)
        return record

    async def delete(self, record: TriageRecord) -> None:
        await self.session.delete(record)
        await self.session.commit()

    def _with_filters(
        self,
        query: Select[tuple[TriageRecord]],
        *,
        priority: int | None,
        status: TriageStatus | None,
        synced: bool | None,
    ) -> Select[tuple[TriageRecord]]:
        if priority is not None:
            query = query.where(TriageRecord.priority == priority)
        if status is not None:
            query = query.where(TriageRecord.status == status)
        if synced is not None:
            query = query.where(TriageRecord.synced == synced)
        return query
