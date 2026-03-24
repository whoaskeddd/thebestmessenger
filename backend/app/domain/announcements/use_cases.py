from __future__ import annotations

import uuid

from app.domain.announcements.exceptions import Forbidden, NotFound
from app.domain.announcements.repositories import AnnouncementsRepository


HR_ROLES = {"admin", "hr"}


class AnnouncementsService:
    def __init__(self, *, announcements: AnnouncementsRepository) -> None:
        self._announcements = announcements

    async def create(
        self,
        *,
        actor_user_id: uuid.UUID,
        actor_role: str,
        title: str,
        body: str,
        is_global: bool,
        department_ids: list[uuid.UUID],
    ):
        if actor_role not in HR_ROLES:
            raise Forbidden()
        return await self._announcements.create(
            created_by_user_id=actor_user_id,
            title=title.strip(),
            body=body,
            is_global=is_global,
            department_ids=department_ids,
        )

    async def list(self, *, actor_user_id: uuid.UUID, actor_role: str, limit: int, offset: int):
        return await self._announcements.list_for_user(
            actor_user_id=actor_user_id,
            actor_role=actor_role,
            limit=limit,
            offset=offset,
        )

    async def get(self, announcement_id: uuid.UUID, *, actor_user_id: uuid.UUID, actor_role: str):
        ann = await self._announcements.get_for_user(
            announcement_id,
            actor_user_id=actor_user_id,
            actor_role=actor_role,
        )
        if ann is None:
            raise NotFound()
        return ann

    async def mark_read(self, announcement_id: uuid.UUID, *, actor_user_id: uuid.UUID, actor_role: str) -> None:
        _ = await self.get(announcement_id, actor_user_id=actor_user_id, actor_role=actor_role)
        await self._announcements.mark_read(announcement_id, user_id=actor_user_id)

