import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

import pytest

from app.domain.messenger.exceptions import Forbidden, InvalidInput, NotFound
from app.domain.messenger.use_cases import MessengerService


@dataclass
class User:
    id: uuid.UUID
    email: str
    is_active: bool = True
    token_version: int = 0


@dataclass
class Chat:
    id: uuid.UUID
    chat_type: str
    title: str | None
    created_by_user_id: uuid.UUID
    created_at: datetime


@dataclass
class ChatMember:
    chat_id: uuid.UUID
    user_id: uuid.UUID
    joined_at: datetime
    last_read_at: datetime | None = None
    last_delivered_at: datetime | None = None


@dataclass
class Message:
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


class FakeUsersRepo:
    def __init__(self, users: list[User]) -> None:
        self._users = {u.id: u for u in users}

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return self._users.get(user_id)


class FakeChatsRepo:
    def __init__(self) -> None:
        self._chats: dict[uuid.UUID, Chat] = {}
        self._members: dict[uuid.UUID, dict[uuid.UUID, ChatMember]] = {}

    async def get(self, chat_id: uuid.UUID) -> Chat | None:
        return self._chats.get(chat_id)

    async def list_for_user(self, user_id: uuid.UUID, *, limit: int, offset: int):
        chat_ids = [cid for cid, members in self._members.items() if user_id in members]
        chats = [self._chats[cid] for cid in chat_ids]
        chats.sort(key=lambda c: c.created_at, reverse=True)
        return chats[offset : offset + limit]

    async def find_direct_chat(self, *, user_a_id: uuid.UUID, user_b_id: uuid.UUID) -> Chat | None:
        for chat in self._chats.values():
            if chat.chat_type != "direct":
                continue
            members = set(self._members.get(chat.id, {}).keys())
            if members == {user_a_id, user_b_id}:
                return chat
        return None

    async def create(self, *, chat_type: str, title: str | None, created_by_user_id: uuid.UUID) -> Chat:
        chat = Chat(
            id=uuid.uuid4(),
            chat_type=chat_type,
            title=title,
            created_by_user_id=created_by_user_id,
            created_at=datetime.now(UTC),
        )
        self._chats[chat.id] = chat
        self._members.setdefault(chat.id, {})
        return chat

    async def add_members(self, chat_id: uuid.UUID, *, user_ids):
        members = self._members.setdefault(chat_id, {})
        for user_id in user_ids:
            if user_id in members:
                continue
            members[user_id] = ChatMember(chat_id=chat_id, user_id=user_id, joined_at=datetime.now(UTC))

    async def list_members(self, chat_id: uuid.UUID):
        return list(self._members.get(chat_id, {}).values())

    async def get_member(self, chat_id: uuid.UUID, user_id: uuid.UUID) -> ChatMember | None:
        return self._members.get(chat_id, {}).get(user_id)

    async def set_member_delivered_at(self, chat_id: uuid.UUID, user_id: uuid.UUID, *, delivered_at: datetime) -> None:
        member = self._members.get(chat_id, {}).get(user_id)
        if member:
            member.last_delivered_at = delivered_at

    async def set_member_read_at(self, chat_id: uuid.UUID, user_id: uuid.UUID, *, read_at: datetime) -> None:
        member = self._members.get(chat_id, {}).get(user_id)
        if member:
            member.last_read_at = read_at


class FakeMessagesRepo:
    def __init__(self) -> None:
        self._messages: list[Message] = []

    async def create_text(self, *, chat_id: uuid.UUID, sender_user_id: uuid.UUID, body: str) -> Message:
        msg = Message(
            id=uuid.uuid4(),
            chat_id=chat_id,
            sender_user_id=sender_user_id,
            message_type="text",
            body=body,
            voice_path=None,
            voice_mime=None,
            voice_size=None,
            voice_duration_seconds=None,
            created_at=datetime.now(UTC),
        )
        self._messages.append(msg)
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
            id=uuid.uuid4(),
            chat_id=chat_id,
            sender_user_id=sender_user_id,
            message_type="voice",
            body=None,
            voice_path=voice_path,
            voice_mime=voice_mime,
            voice_size=voice_size,
            voice_duration_seconds=voice_duration_seconds,
            created_at=datetime.now(UTC),
        )
        self._messages.append(msg)
        return msg

    async def list_for_chat(self, chat_id: uuid.UUID, *, limit: int, before: datetime | None):
        msgs = [m for m in self._messages if m.chat_id == chat_id]
        msgs.sort(key=lambda m: m.created_at, reverse=True)
        if before is not None:
            msgs = [m for m in msgs if m.created_at < before]
        return msgs[:limit]


@pytest.mark.asyncio
async def test_create_direct_chat_idempotent() -> None:
    a = User(id=uuid.uuid4(), email="a@example.com")
    b = User(id=uuid.uuid4(), email="b@example.com")
    service = MessengerService(
        chats=FakeChatsRepo(),
        messages=FakeMessagesRepo(),
        users=FakeUsersRepo([a, b]),
    )

    chat1 = await service.create_direct_chat(actor_user_id=a.id, other_user_id=b.id)
    chat2 = await service.create_direct_chat(actor_user_id=a.id, other_user_id=b.id)
    assert chat1.id == chat2.id


@pytest.mark.asyncio
async def test_create_direct_chat_self_forbidden() -> None:
    a = User(id=uuid.uuid4(), email="a@example.com")
    service = MessengerService(chats=FakeChatsRepo(), messages=FakeMessagesRepo(), users=FakeUsersRepo([a]))

    with pytest.raises(InvalidInput):
        await service.create_direct_chat(actor_user_id=a.id, other_user_id=a.id)


@pytest.mark.asyncio
async def test_create_group_chat_validates_members() -> None:
    a = User(id=uuid.uuid4(), email="a@example.com")
    b = User(id=uuid.uuid4(), email="b@example.com")
    service = MessengerService(
        chats=FakeChatsRepo(),
        messages=FakeMessagesRepo(),
        users=FakeUsersRepo([a, b]),
    )

    with pytest.raises(InvalidInput):
        await service.create_group_chat(actor_user_id=a.id, title="  ", member_user_ids=[b.id])

    with pytest.raises(InvalidInput):
        await service.create_group_chat(actor_user_id=a.id, title="team", member_user_ids=[a.id])

    chat = await service.create_group_chat(actor_user_id=a.id, title="team", member_user_ids=[a.id, b.id, b.id])
    assert chat.chat_type == "group"


@pytest.mark.asyncio
async def test_send_message_requires_membership() -> None:
    a = User(id=uuid.uuid4(), email="a@example.com")
    b = User(id=uuid.uuid4(), email="b@example.com")
    chats = FakeChatsRepo()
    service = MessengerService(chats=chats, messages=FakeMessagesRepo(), users=FakeUsersRepo([a, b]))

    chat = await service.create_direct_chat(actor_user_id=a.id, other_user_id=b.id)

    with pytest.raises(InvalidInput):
        await service.send_text_message(chat.id, actor_user_id=a.id, body="   ")

    outsider = User(id=uuid.uuid4(), email="x@example.com")
    service2 = MessengerService(chats=chats, messages=FakeMessagesRepo(), users=FakeUsersRepo([a, b, outsider]))
    with pytest.raises(Forbidden):
        await service2.send_text_message(chat.id, actor_user_id=outsider.id, body="hi")


@pytest.mark.asyncio
async def test_mark_read_updates_state() -> None:
    a = User(id=uuid.uuid4(), email="a@example.com")
    b = User(id=uuid.uuid4(), email="b@example.com")
    chats = FakeChatsRepo()
    service = MessengerService(chats=chats, messages=FakeMessagesRepo(), users=FakeUsersRepo([a, b]))

    chat = await service.create_direct_chat(actor_user_id=a.id, other_user_id=b.id)
    read_at = await service.mark_read(chat.id, actor_user_id=a.id)
    member = await chats.get_member(chat.id, a.id)
    assert member is not None and member.last_read_at == read_at

