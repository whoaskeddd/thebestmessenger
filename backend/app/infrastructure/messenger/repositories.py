from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import Select, and_, func, insert, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.messenger.repositories import ChatsRepository, MessagesRepository
from app.infrastructure.messenger.models import Chat, ChatMember, Message


class SQLAlchemyChatsRepository(ChatsRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, chat_id: uuid.UUID) -> Chat | None:
        result = await self._session.execute(select(Chat).where(Chat.id == chat_id))
        return result.scalar_one_or_none()

    async def list_for_user(self, user_id: uuid.UUID, *, limit: int, offset: int) -> Sequence[Chat]:
        stmt = (
            select(Chat)
            .join(ChatMember, ChatMember.chat_id == Chat.id)
            .where(ChatMember.user_id == user_id)
            .order_by(Chat.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def find_direct_chat(self, *, user_a_id: uuid.UUID, user_b_id: uuid.UUID) -> Chat | None:
        # Chat is direct and has both members.
        members = ChatMember.__table__
        stmt = (
            select(Chat)
            .join(members, members.c.chat_id == Chat.id)
            .where(Chat.chat_type == "direct")
            .where(members.c.user_id.in_([user_a_id, user_b_id]))
            .group_by(Chat.id)
            .having(func.count(func.distinct(members.c.user_id)) == 2)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, *, chat_type: str, title: str | None, created_by_user_id: uuid.UUID) -> Chat:
        chat = Chat(chat_type=chat_type, title=title, created_by_user_id=created_by_user_id)
        self._session.add(chat)
        await self._session.flush()
        return chat

    async def add_members(self, chat_id: uuid.UUID, *, user_ids: Sequence[uuid.UUID]) -> None:
        if not user_ids:
            return
        await self._session.execute(
            insert(ChatMember),
            [{"chat_id": chat_id, "user_id": user_id} for user_id in user_ids],
        )

    async def list_members(self, chat_id: uuid.UUID) -> Sequence[ChatMember]:
        result = await self._session.execute(select(ChatMember).where(ChatMember.chat_id == chat_id))
        return list(result.scalars().all())

    async def get_member(self, chat_id: uuid.UUID, user_id: uuid.UUID) -> ChatMember | None:
        stmt = select(ChatMember).where(and_(ChatMember.chat_id == chat_id, ChatMember.user_id == user_id))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def set_member_delivered_at(self, chat_id: uuid.UUID, user_id: uuid.UUID, *, delivered_at: datetime) -> None:
        await self._session.execute(
            update(ChatMember)
            .where(and_(ChatMember.chat_id == chat_id, ChatMember.user_id == user_id))
            .values(last_delivered_at=delivered_at)
        )

    async def set_member_read_at(self, chat_id: uuid.UUID, user_id: uuid.UUID, *, read_at: datetime) -> None:
        await self._session.execute(
            update(ChatMember)
            .where(and_(ChatMember.chat_id == chat_id, ChatMember.user_id == user_id))
            .values(last_read_at=read_at)
        )


class SQLAlchemyMessagesRepository(MessagesRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_text(self, *, chat_id: uuid.UUID, sender_user_id: uuid.UUID, body: str) -> Message:
        msg = Message(
            chat_id=chat_id,
            sender_user_id=sender_user_id,
            message_type="text",
            body=body,
        )
        self._session.add(msg)
        await self._session.flush()
        return msg

    async def create_voice(
        self,
        *,
        chat_id: uuid.UUID,
        sender_user_id: uuid.UUID,
        voice_path: str,
        voice_mime: str,
        voice_size: int,
        voice_duration_seconds: int | None,
    ) -> Message:
        msg = Message(
            chat_id=chat_id,
            sender_user_id=sender_user_id,
            message_type="voice",
            body=None,
            voice_path=voice_path,
            voice_mime=voice_mime,
            voice_size=voice_size,
            voice_duration_seconds=voice_duration_seconds,
        )
        self._session.add(msg)
        await self._session.flush()
        return msg

    async def list_for_chat(
        self,
        chat_id: uuid.UUID,
        *,
        limit: int,
        before: datetime | None,
    ) -> Sequence[Message]:
        stmt: Select[tuple[Message]] = (
            select(Message)
            .where(Message.chat_id == chat_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        if before is not None:
            stmt = stmt.where(Message.created_at < before)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

