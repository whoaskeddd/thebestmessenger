"""announcements and hr tasks

Revision ID: 20260324_0005
Revises: 20260324_0004
Create Date: 2026-03-24

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "20260324_0005"
down_revision = "20260324_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "announcements",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "created_by_user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("body", sa.String(length=10000), nullable=False),
        sa.Column("is_global", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_announcements_created_by_user_id", "announcements", ["created_by_user_id"])
    op.create_index("ix_announcements_is_global", "announcements", ["is_global"])

    op.create_table(
        "announcement_departments",
        sa.Column(
            "announcement_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("announcements.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "department_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("departments.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
    )

    op.create_table(
        "announcement_reads",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "announcement_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("announcements.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("announcement_id", "user_id", name="uq_announcement_reads"),
    )
    op.create_index("ix_announcement_reads_announcement_id", "announcement_reads", ["announcement_id"])
    op.create_index("ix_announcement_reads_user_id", "announcement_reads", ["user_id"])

    op.create_table(
        "hr_tasks",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "created_by_user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "announcement_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("announcements.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=4000), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_hr_tasks_created_by_user_id", "hr_tasks", ["created_by_user_id"])
    op.create_index("ix_hr_tasks_announcement_id", "hr_tasks", ["announcement_id"])

    op.create_table(
        "hr_task_assignments",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "task_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("hr_tasks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("task_id", "user_id", name="uq_hr_task_assignment"),
    )
    op.create_index("ix_hr_task_assignments_task_id", "hr_task_assignments", ["task_id"])
    op.create_index("ix_hr_task_assignments_user_id", "hr_task_assignments", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_hr_task_assignments_user_id", table_name="hr_task_assignments")
    op.drop_index("ix_hr_task_assignments_task_id", table_name="hr_task_assignments")
    op.drop_table("hr_task_assignments")

    op.drop_index("ix_hr_tasks_announcement_id", table_name="hr_tasks")
    op.drop_index("ix_hr_tasks_created_by_user_id", table_name="hr_tasks")
    op.drop_table("hr_tasks")

    op.drop_index("ix_announcement_reads_user_id", table_name="announcement_reads")
    op.drop_index("ix_announcement_reads_announcement_id", table_name="announcement_reads")
    op.drop_table("announcement_reads")

    op.drop_table("announcement_departments")

    op.drop_index("ix_announcements_is_global", table_name="announcements")
    op.drop_index("ix_announcements_created_by_user_id", table_name="announcements")
    op.drop_table("announcements")

