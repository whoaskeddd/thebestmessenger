from __future__ import annotations

from fastapi import WebSocket, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.infrastructure.auth.repositories import SQLAlchemyUserRepository


async def get_current_user_ws(websocket: WebSocket, session: AsyncSession):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    try:
        payload = decode_access_token(token)
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    repo = SQLAlchemyUserRepository(session)
    user = await repo.get_by_id(payload.user_id)
    if user is None or not user.is_active:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None
    if user.token_version != payload.token_version:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    return user

