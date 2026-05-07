"""employees and departments

Revision ID: 20260324_0003
Revises: 20260324_0002
Create Date: 2026-03-24

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "20260324_0003"
down_revision = "20260324_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "departments",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("name", name="uq_departments_name"),
    )
    op.create_index("ix_departments_name", "departments", ["name"])

    op.create_table(
        "employees",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("first_name", sa.String(length=64), nullable=False),
        sa.Column("last_name", sa.String(length=64), nullable=False),
        sa.Column("middle_name", sa.String(length=64), nullable=True),
        sa.Column("work_email", sa.String(length=320), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("position", sa.String(length=128), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("work_email", name="uq_employees_work_email"),
        sa.UniqueConstraint("user_id", name="uq_employees_user_id"),
    )
    op.create_index("ix_employees_user_id", "employees", ["user_id"])
    op.create_index("ix_employees_work_email", "employees", ["work_email"])

    op.create_table(
        "employee_departments",
        sa.Column(
            "employee_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("employees.id", ondelete="CASCADE"),
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


def downgrade() -> None:
    op.drop_table("employee_departments")
    op.drop_index("ix_employees_work_email", table_name="employees")
    op.drop_index("ix_employees_user_id", table_name="employees")
    op.drop_table("employees")
    op.drop_index("ix_departments_name", table_name="departments")
    op.drop_table("departments")

