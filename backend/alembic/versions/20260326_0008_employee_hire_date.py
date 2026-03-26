"""add hire_date to employees

Revision ID: 20260326_0008
Revises: 20260326_0007
Create Date: 2026-03-26

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "20260326_0008"
down_revision = "20260326_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("employees", sa.Column("hire_date", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("employees", "hire_date")
