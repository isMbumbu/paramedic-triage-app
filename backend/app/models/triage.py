import enum
from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TriageStatus(str, enum.Enum):
    pending = "Pending"
    in_transit = "In-Transit"


class TriageRecord(Base):
    __tablename__ = "triage_records"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    patient_name: Mapped[str] = mapped_column(String(160), nullable=False)
    condition_description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    status: Mapped[TriageStatus] = mapped_column(Enum(TriageStatus), nullable=False, index=True)
    synced: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
