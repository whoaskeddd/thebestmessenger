"""leave request reads and task seen flags

Revision ID: 20260326_0007
Revises: 20260326_0006
Create Date: 2026-03-26

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "20260326_0007"
down_revision = "20260326_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("hr_task_assignments", sa.Column("seen_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "leave_request_reads",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "request_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("leave_requests.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("request_id", "user_id", name="uq_leave_request_read"),
    )
    op.create_index("ix_leave_request_reads_request_id", "leave_request_reads", ["request_id"])
    op.create_index("ix_leave_request_reads_user_id", "leave_request_reads", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_leave_request_reads_user_id", table_name="leave_request_reads")
    op.drop_index("ix_leave_request_reads_request_id", table_name="leave_request_reads")
    op.drop_table("leave_request_reads")

    op.drop_column("hr_task_assignments", "seen_at")

