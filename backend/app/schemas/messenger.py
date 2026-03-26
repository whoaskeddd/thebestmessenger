from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ChatType = Literal["direct", "group"]
MessageType = Literal["text", "voice"]


class ChatCreateRequest(BaseModel):
    chat_type: ChatType = Field(..., alias="chatType")
    other_user_id: uuid.UUID | None = Field(default=None, alias="otherUserId")
    title: str | None = None
    member_user_ids: list[uuid.UUID] | None = Field(default=None, alias="memberUserIds")


class ChatMemberResponse(BaseModel):
    user_id: uuid.UUID = Field(..., alias="userId")


class MessagePreviewResponse(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID = Field(..., alias="senderId")
    sender_name: str = Field(..., alias="senderName")
    message_type: MessageType = Field(..., alias="messageType")
    body: str | None = None
    created_at: datetime = Field(..., alias="createdAt")


class ChatResponse(BaseModel):
    id: uuid.UUID
    chat_type: ChatType = Field(..., alias="chatType")
    title: str
    members: list[ChatMemberResponse]
    unread_count: int = Field(default=0, alias="unreadCount")
    last_message: MessagePreviewResponse | None = Field(default=None, alias="lastMessage")
    created_at: datetime = Field(..., alias="createdAt")


class MessageCreateRequest(BaseModel):
    body: str


class MessageResponse(BaseModel):
    id: uuid.UUID
    chat_id: uuid.UUID = Field(..., alias="chatId")
    sender_id: uuid.UUID = Field(..., alias="senderId")
    sender_name: str = Field(..., alias="senderName")
    message_type: MessageType = Field(..., alias="messageType")
    body: str | None = None
    voice_url: str | None = Field(default=None, alias="voiceUrl")
    created_at: datetime = Field(..., alias="createdAt")




class ChatReadResponse(BaseModel):
    chat_id: uuid.UUID = Field(..., alias="chatId")
    user_id: uuid.UUID = Field(..., alias="userId")
    read_at: datetime = Field(..., alias="readAt")
