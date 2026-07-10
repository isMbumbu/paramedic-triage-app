"""create triage records

Revision ID: 0001_create_triage_records
Revises:
Create Date: 2026-07-10
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_create_triage_records"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create the triage_records table and supporting indexes."""

    status_enum = sa.Enum("Pending", "In-Transit", name="triagestatus")
    status_enum.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "triage_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("patient_name", sa.String(length=160), nullable=False),
        sa.Column("condition_description", sa.Text(), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False),
        sa.Column("status", status_enum, nullable=False),
        sa.Column("synced", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("priority BETWEEN 1 AND 5", name="ck_triage_priority_range"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_triage_records_priority", "triage_records", ["priority"])
    op.create_index(
        "ix_triage_records_priority_status",
        "triage_records",
        ["priority", "status"],
    )
    op.create_index("ix_triage_records_status", "triage_records", ["status"])
    op.create_index("ix_triage_records_synced", "triage_records", ["synced"])


def downgrade() -> None:
    """Drop the triage_records table and supporting enum."""

    op.drop_index("ix_triage_records_synced", table_name="triage_records")
    op.drop_index("ix_triage_records_status", table_name="triage_records")
    op.drop_index("ix_triage_records_priority_status", table_name="triage_records")
    op.drop_index("ix_triage_records_priority", table_name="triage_records")
    op.drop_table("triage_records")
    sa.Enum(name="triagestatus").drop(op.get_bind(), checkfirst=True)
