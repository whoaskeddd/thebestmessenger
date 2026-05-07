from __future__ import annotations

import uuid
from datetime import UTC, datetime

from app.domain.messenger.exceptions import Forbidden, InvalidInput, NotFound
from app.domain.messenger.repositories import ChatsRepository, MessagesRepository, UsersRepository


class MessengerService:
    def __init__(
        self,
        *,
        chats: ChatsRepository,
        messages: MessagesRepository,
        users: UsersRepository,
    ) -> None:
        self._chats = chats
        self._messages = messages
        self._users = users

    async def list_chats(self, *, actor_user_id: uuid.UUID, limit: int, offset: int):
        return await self._chats.list_for_user(actor_user_id, limit=limit, offset=offset)

    async def get_chat(self, chat_id: uuid.UUID, *, actor_user_id: uuid.UUID):
        chat = await self._chats.get(chat_id)
        if chat is None:
            raise NotFound()
        member = await self._chats.get_member(chat_id, actor_user_id)
        if member is None:
            raise Forbidden()
        return chat

    async def create_direct_chat(self, *, actor_user_id: uuid.UUID, other_user_id: uuid.UUID):
        if actor_user_id == other_user_id:
            raise InvalidInput("cannot create direct chat with self")
        other = await self._users.get_by_id(other_user_id)
        if other is None:
            raise NotFound()

        existing = await self._chats.find_direct_chat(user_a_id=actor_user_id, user_b_id=other_user_id)
        if existing is not None:
            return existing

        chat = await self._chats.create(chat_type="direct", title=None, created_by_user_id=actor_user_id)
        await self._chats.add_members(chat.id, user_ids=[actor_user_id, other_user_id])
        return chat

    async def create_group_chat(
        self,
        *,
        actor_user_id: uuid.UUID,
        title: str,
        member_user_ids: list[uuid.UUID],
    ):
        normalized = [user_id for user_id in dict.fromkeys(member_user_ids) if user_id != actor_user_id]
        if not title.strip():
            raise InvalidInput("title is required for group chats")
        if len(normalized) < 1:
            raise InvalidInput("at least 1 other member required")

        # Ensure all users exist.
        for user_id in normalized:
            if await self._users.get_by_id(user_id) is None:
                raise NotFound()

        chat = await self._chats.create(chat_type="group", title=title.strip(), created_by_user_id=actor_user_id)
        await self._chats.add_members(chat.id, user_ids=[actor_user_id, *normalized])
        return chat

    async def list_messages(
        self,
        chat_id: uuid.UUID,
        *,
        actor_user_id: uuid.UUID,
        limit: int,
        before: datetime | None,
    ):
        if await self._chats.get_member(chat_id, actor_user_id) is None:
            raise Forbidden()
        return await self._messages.list_for_chat(chat_id, limit=limit, before=before)

    async def send_text_message(
        self,
        chat_id: uuid.UUID,
        *,
        actor_user_id: uuid.UUID,
        body: str,
    ):
        if not body.strip():
            raise InvalidInput("empty message")
        if await self._chats.get_member(chat_id, actor_user_id) is None:
            raise Forbidden()
        return await self._messages.create_text(chat_id=chat_id, sender_user_id=actor_user_id, body=body.strip())

    async def create_voice_message(
        self,
        chat_id: uuid.UUID,
        *,
        actor_user_id: uuid.UUID,
        voice_path: str,
        voice_mime: str,
        voice_size: int,
        voice_duration_seconds: int | None,
    ):
        if await self._chats.get_member(chat_id, actor_user_id) is None:
            raise Forbidden()
        return await self._messages.create_voice(
            chat_id=chat_id,
            sender_user_id=actor_user_id,
            voice_path=voice_path,
            voice_mime=voice_mime,
            voice_size=voice_size,
            voice_duration_seconds=voice_duration_seconds,
        )

    async def mark_delivered(self, chat_id: uuid.UUID, *, actor_user_id: uuid.UUID) -> datetime:
        delivered_at = datetime.now(UTC)
        if await self._chats.get_member(chat_id, actor_user_id) is None:
            raise Forbidden()
        await self._chats.set_member_delivered_at(chat_id, actor_user_id, delivered_at=delivered_at)
        return delivered_at

    async def mark_read(self, chat_id: uuid.UUID, *, actor_user_id: uuid.UUID) -> datetime:
        read_at = datetime.now(UTC)
        if await self._chats.get_member(chat_id, actor_user_id) is None:
            raise Forbidden()
        await self._chats.set_member_read_at(chat_id, actor_user_id, read_at=read_at)
        return read_at
