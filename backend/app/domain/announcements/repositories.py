from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Protocol


class AnnouncementDTO(Protocol):
    id: uuid.UUID
    created_by_user_id: uuid.UUID
    title: str
    body: str
    is_global: bool


class AnnouncementsRepository(Protocol):
    async def create(
        self,
        *,
        created_by_user_id: uuid.UUID,
        title: str,
        body: str,
        is_global: bool,
        department_ids: Sequence[uuid.UUID],
    ) -> AnnouncementDTO: ...

    async def get_for_user(
        self,
        announcement_id: uuid.UUID,
        *,
        actor_user_id: uuid.UUID,
        actor_role: str,
    ) -> AnnouncementDTO | None: ...

    async def list_for_user(
        self,
        *,
        actor_user_id: uuid.UUID,
        actor_role: str,
        limit: int,
        offset: int,
    ) -> Sequence[AnnouncementDTO]: ...

    async def mark_read(self, announcement_id: uuid.UUID, *, user_id: uuid.UUID) -> None: ...

    async def is_read(self, announcement_id: uuid.UUID, *, user_id: uuid.UUID) -> bool: ...

