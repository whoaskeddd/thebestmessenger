from __future__ import annotations

import asyncio
import uuid
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._by_chat: dict[uuid.UUID, set[WebSocket]] = defaultdict(set)

    async def connect(self, chat_id: uuid.UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._by_chat[chat_id].add(websocket)

    async def disconnect(self, chat_id: uuid.UUID, websocket: WebSocket) -> None:
        async with self._lock:
            if chat_id in self._by_chat:
                self._by_chat[chat_id].discard(websocket)
                if not self._by_chat[chat_id]:
                    del self._by_chat[chat_id]

    async def broadcast(self, chat_id: uuid.UUID, payload: dict) -> None:
        async with self._lock:
            websockets = list(self._by_chat.get(chat_id, set()))
        for ws in websockets:
            try:
                await ws.send_json(payload)
            except Exception:
                # Drop broken connections quietly.
                await self.disconnect(chat_id, ws)

