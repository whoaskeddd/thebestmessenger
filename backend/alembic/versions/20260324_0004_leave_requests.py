"""leave requests

Revision ID: 20260324_0004
Revises: 20260324_0003
Create Date: 2026-03-24

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "20260324_0004"
down_revision = "20260324_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "leave_requests",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("request_type", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("reason", sa.String(length=512), nullable=True),
        sa.Column("hr_comment", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_leave_requests_user_id", "leave_requests", ["user_id"])
    op.create_index("ix_leave_requests_request_type", "leave_requests", ["request_type"])
    op.create_index("ix_leave_requests_status", "leave_requests", ["status"])
    op.create_index("ix_leave_requests_start_date", "leave_requests", ["start_date"])
    op.create_index("ix_leave_requests_end_date", "leave_requests", ["end_date"])

    op.create_table(
        "leave_request_events",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "request_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("leave_requests.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "actor_user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("from_status", sa.String(length=32), nullable=True),
        sa.Column("to_status", sa.String(length=32), nullable=False),
        sa.Column("comment", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_leave_request_events_request_id", "leave_request_events", ["request_id"])
    op.create_index("ix_leave_request_events_actor_user_id", "leave_request_events", ["actor_user_id"])


def downgrade() -> None:
    op.drop_index("ix_leave_request_events_actor_user_id", table_name="leave_request_events")
    op.drop_index("ix_leave_request_events_request_id", table_name="leave_request_events")
    op.drop_table("leave_request_events")

    op.drop_index("ix_leave_requests_end_date", table_name="leave_requests")
    op.drop_index("ix_leave_requests_start_date", table_name="leave_requests")
    op.drop_index("ix_leave_requests_status", table_name="leave_requests")
    op.drop_index("ix_leave_requests_request_type", table_name="leave_requests")
    op.drop_index("ix_leave_requests_user_id", table_name="leave_requests")
    op.drop_table("leave_requests")

