from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import date, datetime
from typing import Protocol


class HrTaskDTO(Protocol):
    id: uuid.UUID
    created_by_user_id: uuid.UUID
    announcement_id: uuid.UUID | None
    title: str
    description: str | None
    due_date: date | None
    created_at: datetime


class HrTaskAssignmentDTO(Protocol):
    id: uuid.UUID
    task_id: uuid.UUID
    user_id: uuid.UUID
    seen_at: datetime | None
    completed_at: datetime | None


class HrTasksRepository(Protocol):
    async def create(
        self,
        *,
        created_by_user_id: uuid.UUID,
        announcement_id: uuid.UUID | None,
        title: str,
        description: str | None,
        due_date: date | None,
    ) -> HrTaskDTO: ...

    async def get(self, task_id: uuid.UUID) -> HrTaskDTO | None: ...

    async def list_all(self, *, limit: int, offset: int) -> Sequence[HrTaskDTO]: ...


class HrTaskAssignmentsRepository(Protocol):
    async def assign(self, *, task_id: uuid.UUID, user_ids: Sequence[uuid.UUID]) -> None: ...

    async def list_for_user(
        self, *, user_id: uuid.UUID, include_completed: bool, limit: int, offset: int
    ) -> Sequence[tuple[HrTaskDTO, HrTaskAssignmentDTO]]: ...

    async def complete(self, *, task_id: uuid.UUID, user_id: uuid.UUID) -> bool: ...

    async def unseen_count(self, *, user_id: uuid.UUID) -> int: ...

    async def mark_all_seen(self, *, user_id: uuid.UUID) -> None: ...
