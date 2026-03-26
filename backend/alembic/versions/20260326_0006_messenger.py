"""messenger chats and messages

Revision ID: 20260326_0006
Revises: 20260324_0005
Create Date: 2026-03-26

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "20260326_0006"
down_revision = "20260324_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "chats",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("chat_type", sa.String(length=16), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=True),
        sa.Column(
            "created_by_user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_chats_created_by_user_id", "chats", ["created_by_user_id"])
    op.create_index("ix_chats_chat_type", "chats", ["chat_type"])

    op.create_table(
        "chat_members",
        sa.Column(
            "chat_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("chats.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("last_delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_read_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_chat_members_user_id", "chat_members", ["user_id"])
    op.create_index("ix_chat_members_chat_id", "chat_members", ["chat_id"])

    op.create_table(
        "messages",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "chat_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("chats.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "sender_user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("message_type", sa.String(length=16), nullable=False),
        sa.Column("body", sa.String(length=10000), nullable=True),
        sa.Column("voice_path", sa.String(length=500), nullable=True),
        sa.Column("voice_mime", sa.String(length=120), nullable=True),
        sa.Column("voice_size", sa.Integer(), nullable=True),
        sa.Column("voice_duration_seconds", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_messages_chat_id", "messages", ["chat_id"])
    op.create_index("ix_messages_sender_user_id", "messages", ["sender_user_id"])
    op.create_index("ix_messages_message_type", "messages", ["message_type"])
    op.create_index("ix_messages_created_at", "messages", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_messages_created_at", table_name="messages")
    op.drop_index("ix_messages_message_type", table_name="messages")
    op.drop_index("ix_messages_sender_user_id", table_name="messages")
    op.drop_index("ix_messages_chat_id", table_name="messages")
    op.drop_table("messages")

    op.drop_index("ix_chat_members_chat_id", table_name="chat_members")
    op.drop_index("ix_chat_members_user_id", table_name="chat_members")
    op.drop_table("chat_members")

    op.drop_index("ix_chats_chat_type", table_name="chats")
    op.drop_index("ix_chats_created_by_user_id", table_name="chats")
    op.drop_table("chats")

