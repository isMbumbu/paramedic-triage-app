"""SQLAlchemy models for triage intake records."""

import enum
from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, CheckConstraint, DateTime, Enum, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def utc_now() -> datetime:
    """Return a timezone-aware UTC timestamp for database defaults."""

    return datetime.now(UTC)


class TriageStatus(str, enum.Enum):
    """Patient transport workflow states supported by the intake form."""

    pending = "Pending"
    in_transit = "In-Transit"


class TriageRecord(Base):
    """Persisted triage record submitted by a field paramedic."""

    __tablename__ = "triage_records"
    __table_args__ = (
        CheckConstraint("priority BETWEEN 1 AND 5", name="ck_triage_priority_range"),
        Index("ix_triage_records_priority_status", "priority", "status"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    patient_name: Mapped[str] = mapped_column(String(160), nullable=False)
    condition_description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    status: Mapped[TriageStatus] = mapped_column(
        Enum(TriageStatus, values_callable=lambda enum_: [item.value for item in enum_]),
        nullable=False,
        index=True,
    )
    synced: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
    )
