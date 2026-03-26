from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, WebSocket, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth.security import get_current_user
from app.api.deps import DbSessionDep
from app.api.messenger.manager import ConnectionManager
from app.api.messenger.security import get_current_user_ws
from app.domain.messenger.exceptions import Forbidden, InvalidInput, NotFound
from app.domain.messenger.use_cases import MessengerService
from app.infrastructure.auth.repositories import SQLAlchemyUserRepository
from app.infrastructure.messenger.repositories import SQLAlchemyChatsRepository, SQLAlchemyMessagesRepository
from app.core.config import get_settings
from app.schemas.messenger import (
    ChatCreateRequest,
    ChatMemberResponse,
    ChatReadResponse,
    ChatResponse,
    MessageCreateRequest,
    MessagePreviewResponse,
    MessageResponse,
)


router = APIRouter(tags=["messenger"])
manager = ConnectionManager()

MAX_VOICE_BYTES = 10 * 1024 * 1024
MAX_VOICE_DURATION_SECONDS = 120


def _service(session: AsyncSession) -> MessengerService:
    return MessengerService(
        chats=SQLAlchemyChatsRepository(session),
        messages=SQLAlchemyMessagesRepository(session),
        users=SQLAlchemyUserRepository(session),
    )


async def _user_display_name(session: AsyncSession, user_id: uuid.UUID) -> str:
    user = await SQLAlchemyUserRepository(session).get_by_id(user_id)
    return user.email if user is not None else str(user_id)


async def _chat_response(session: AsyncSession, chat, *, actor_user_id: uuid.UUID) -> ChatResponse:
    chats_repo = SQLAlchemyChatsRepository(session)
    messages_repo = SQLAlchemyMessagesRepository(session)
    members = await chats_repo.list_members(chat.id)
    title = chat.title or "Chat"
    if chat.chat_type == "direct":
        other_ids = [m.user_id for m in members if m.user_id != actor_user_id]
        if other_ids:
            title = await _user_display_name(session, other_ids[0])

    current_member = next((m for m in members if m.user_id == actor_user_id), None)
    unread_count = await messages_repo.count_unread_for_chat(
        chat.id,
        user_id=actor_user_id,
        last_read_at=current_member.last_read_at if current_member is not None else None,
    )
    last_message = await messages_repo.get_last_for_chat(chat.id)
    last_message_response = None
    if last_message is not None:
        last_message_response = MessagePreviewResponse(
            id=last_message.id,
            senderId=last_message.sender_user_id,
            senderName=await _user_display_name(session, last_message.sender_user_id),
            messageType=last_message.message_type,
            body=last_message.body,
            createdAt=last_message.created_at,
        )

    return ChatResponse(
        id=chat.id,
        chatType=chat.chat_type,
        title=title,
        members=[ChatMemberResponse(userId=m.user_id) for m in members],
        unreadCount=unread_count,
        lastMessage=last_message_response,
        createdAt=chat.created_at,
    )


async def _message_response(session: AsyncSession, msg) -> MessageResponse:
    voice_url = f"/media/{msg.voice_path}" if msg.message_type == "voice" and msg.voice_path else None
    return MessageResponse(
        id=msg.id,
        chatId=msg.chat_id,
        senderId=msg.sender_user_id,
        senderName=await _user_display_name(session, msg.sender_user_id),
        messageType=msg.message_type,
        body=msg.body,
        voiceUrl=voice_url,
        createdAt=msg.created_at,
    )


@router.get("/chats", response_model=list[ChatResponse])
async def list_chats(
    session: DbSessionDep,
    user=Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[ChatResponse]:
    chats = await _service(session).list_chats(actor_user_id=user.id, limit=limit, offset=offset)
    return [await _chat_response(session, c, actor_user_id=user.id) for c in chats]


@router.post("/chats", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def create_chat(payload: ChatCreateRequest, session: DbSessionDep, user=Depends(get_current_user)) -> ChatResponse:
    service = _service(session)
    try:
        if payload.chat_type == "direct":
            if payload.other_user_id is None:
                raise InvalidInput("otherUserId is required for direct chats")
            chat = await service.create_direct_chat(actor_user_id=user.id, other_user_id=payload.other_user_id)
        else:
            member_ids = payload.member_user_ids or []
            if payload.title is None:
                raise InvalidInput("title is required for group chats")
            chat = await service.create_group_chat(
                actor_user_id=user.id,
                title=payload.title,
                member_user_ids=member_ids,
            )
        await session.commit()
        return await _chat_response(session, chat, actor_user_id=user.id)
    except NotFound as exc:
        await session.rollback()
        raise HTTPException(status_code=404, detail="not found") from exc
    except Forbidden as exc:
        await session.rollback()
        raise HTTPException(status_code=403, detail="forbidden") from exc
    except InvalidInput as exc:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/chats/{chat_id}", response_model=ChatResponse)
async def get_chat(chat_id: uuid.UUID, session: DbSessionDep, user=Depends(get_current_user)) -> ChatResponse:
    try:
        chat = await _service(session).get_chat(chat_id, actor_user_id=user.id)
        return await _chat_response(session, chat, actor_user_id=user.id)
    except NotFound as exc:
        raise HTTPException(status_code=404, detail="not found") from exc
    except Forbidden as exc:
        raise HTTPException(status_code=403, detail="forbidden") from exc


@router.get("/chats/{chat_id}/messages", response_model=list[MessageResponse])
async def list_messages(
    chat_id: uuid.UUID,
    session: DbSessionDep,
    user=Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=200),
    before: datetime | None = Query(default=None),
) -> list[MessageResponse]:
    try:
        messages = await _service(session).list_messages(chat_id, actor_user_id=user.id, limit=limit, before=before)
        # DB returns newest-first, API returns oldest-first for easier rendering.
        messages = list(reversed(messages))
        return [await _message_response(session, m) for m in messages]
    except Forbidden as exc:
        raise HTTPException(status_code=403, detail="forbidden") from exc


@router.post("/chats/{chat_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    chat_id: uuid.UUID,
    payload: MessageCreateRequest,
    session: DbSessionDep,
    user=Depends(get_current_user),
) -> MessageResponse:
    service = _service(session)
    try:
        msg = await service.send_text_message(chat_id, actor_user_id=user.id, body=payload.body)
        await session.commit()
        response = await _message_response(session, msg)
        await manager.broadcast(chat_id, {"type": "chat.message", **response.model_dump(by_alias=True)})
        return response
    except Forbidden as exc:
        await session.rollback()
        raise HTTPException(status_code=403, detail="forbidden") from exc
    except InvalidInput as exc:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/chats/{chat_id}/read", response_model=ChatReadResponse)
async def mark_chat_read(chat_id: uuid.UUID, session: DbSessionDep, user=Depends(get_current_user)) -> ChatReadResponse:
    service = _service(session)
    try:
        read_at = await service.mark_read(chat_id, actor_user_id=user.id)
        await session.commit()
        payload = ChatReadResponse(chatId=chat_id, userId=user.id, readAt=read_at)
        await manager.broadcast(chat_id, {"type": "chat.read", **payload.model_dump(by_alias=True)})
        return payload
    except Forbidden as exc:
        await session.rollback()
        raise HTTPException(status_code=403, detail="forbidden") from exc


@router.post("/chats/{chat_id}/voice", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def upload_voice_message(
    chat_id: uuid.UUID,
    session: DbSessionDep,
    user=Depends(get_current_user),
    file: UploadFile = File(...),
    duration_seconds: int | None = Form(default=None),
) -> MessageResponse:
    if duration_seconds is not None and duration_seconds > MAX_VOICE_DURATION_SECONDS:
        raise HTTPException(status_code=400, detail="voice message too long")

    content_type = file.content_type or "application/octet-stream"
    if not content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="invalid content type")

    raw = await file.read()
    if len(raw) > MAX_VOICE_BYTES:
        raise HTTPException(status_code=413, detail="file too large")

    # Persist file under MEDIA_ROOT and store relative path in DB.
    settings = get_settings()
    ext = Path(file.filename or "").suffix or ".bin"
    relative = f"voice/{chat_id}/{uuid.uuid4()}{ext}"
    absolute = Path(settings.media_root) / relative

    await asyncio.to_thread(absolute.parent.mkdir, parents=True, exist_ok=True)
    await asyncio.to_thread(absolute.write_bytes, raw)

    service = _service(session)
    try:
        msg = await service.create_voice_message(
            chat_id,
            actor_user_id=user.id,
            voice_path=relative,
            voice_mime=content_type,
            voice_size=len(raw),
            voice_duration_seconds=duration_seconds,
        )
        await session.commit()
        response = await _message_response(session, msg)
        await manager.broadcast(chat_id, {"type": "chat.message", **response.model_dump(by_alias=True)})
        return response
    except Forbidden as exc:
        await session.rollback()
        raise HTTPException(status_code=403, detail="forbidden") from exc


@router.websocket("/ws/chats/{chat_id}")
async def chat_ws(websocket: WebSocket, chat_id: uuid.UUID, session: DbSessionDep) -> None:
    user = await get_current_user_ws(websocket, session)
    if user is None:
        return

    service = _service(session)
    try:
        await service.mark_delivered(chat_id, actor_user_id=user.id)
        await session.commit()
    except Forbidden:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(chat_id, websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                payload = json.loads(raw)
            except Exception:
                continue

            event_type = payload.get("type")
            if event_type == "chat.message":
                body = str(payload.get("body") or "")
                try:
                    msg = await service.send_text_message(chat_id, actor_user_id=user.id, body=body)
                    await session.commit()
                    msg_payload = await _message_response(session, msg)
                    await manager.broadcast(chat_id, {"type": "chat.message", **msg_payload.model_dump(by_alias=True)})
                except (Forbidden, InvalidInput):
                    await session.rollback()
            elif event_type == "chat.read":
                try:
                    read_at = await service.mark_read(chat_id, actor_user_id=user.id)
                    await session.commit()
                    read_payload = ChatReadResponse(chatId=chat_id, userId=user.id, readAt=read_at)
                    await manager.broadcast(chat_id, {"type": "chat.read", **read_payload.model_dump(by_alias=True)})
                except Forbidden:
                    await session.rollback()
            else:
                continue
    finally:
        await manager.disconnect(chat_id, websocket)
