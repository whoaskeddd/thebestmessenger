from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import datetime
from typing import Protocol


class ChatDTO(Protocol):
    id: uuid.UUID
    chat_type: str
    title: str | None
    created_by_user_id: uuid.UUID
    created_at: datetime


class ChatMemberDTO(Protocol):
    chat_id: uuid.UUID
    user_id: uuid.UUID
    joined_at: datetime
    last_read_at: datetime | None
    last_delivered_at: datetime | None


class MessageDTO(Protocol):
    id: uuid.UUID
    chat_id: uuid.UUID
    sender_user_id: uuid.UUID
    message_type: str
    body: str | None
    voice_path: str | None
    voice_mime: str | None
    voice_size: int | None
    voice_duration_seconds: int | None
    created_at: datetime


class UsersRepository(Protocol):
    async def get_by_id(self, user_id: uuid.UUID): ...


class ChatsRepository(Protocol):
    async def get(self, chat_id: uuid.UUID) -> ChatDTO | None: ...

    async def list_for_user(self, user_id: uuid.UUID, *, limit: int, offset: int) -> Sequence[ChatDTO]: ...

    async def find_direct_chat(self, *, user_a_id: uuid.UUID, user_b_id: uuid.UUID) -> ChatDTO | None: ...

    async def create(
        self,
        *,
        chat_type: str,
        title: str | None,
        created_by_user_id: uuid.UUID,
    ) -> ChatDTO: ...

    async def add_members(self, chat_id: uuid.UUID, *, user_ids: Sequence[uuid.UUID]) -> None: ...

    async def list_members(self, chat_id: uuid.UUID) -> Sequence[ChatMemberDTO]: ...

    async def get_member(self, chat_id: uuid.UUID, user_id: uuid.UUID) -> ChatMemberDTO | None: ...

    async def set_member_delivered_at(self, chat_id: uuid.UUID, user_id: uuid.UUID, *, delivered_at: datetime) -> None: ...

    async def set_member_read_at(self, chat_id: uuid.UUID, user_id: uuid.UUID, *, read_at: datetime) -> None: ...


class MessagesRepository(Protocol):
    async def create_text(
        self,
        *,
        chat_id: uuid.UUID,
        sender_user_id: uuid.UUID,
        body: str,
    ) -> MessageDTO: ...

    async def create_voice(
        self,
        *,
        chat_id: uuid.UUID,
        sender_user_id: uuid.UUID,
        voice_path: str,
        voice_mime: str,
        voice_size: int,
        voice_duration_seconds: int | None,
    ) -> MessageDTO: ...

    async def list_for_chat(
        self,
        chat_id: uuid.UUID,
        *,
        limit: int,
        before: datetime | None,
    ) -> Sequence[MessageDTO]: ...

    async def get_last_for_chat(self, chat_id: uuid.UUID) -> MessageDTO | None: ...

    async def count_unread_for_chat(
        self,
        chat_id: uuid.UUID,
        *,
        user_id: uuid.UUID,
        last_read_at: datetime | None,
    ) -> int: ...
