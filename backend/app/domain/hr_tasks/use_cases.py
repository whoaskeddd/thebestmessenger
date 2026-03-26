from __future__ import annotations

import uuid
from datetime import date

from app.domain.hr_tasks.exceptions import Forbidden, NotFound
from app.domain.hr_tasks.repositories import HrTaskAssignmentsRepository, HrTasksRepository


HR_ROLES = {"admin", "hr"}


class HrTasksService:
    def __init__(self, *, tasks: HrTasksRepository, assignments: HrTaskAssignmentsRepository) -> None:
        self._tasks = tasks
        self._assignments = assignments

    async def create(
        self,
        *,
        actor_user_id: uuid.UUID,
        actor_role: str,
        title: str,
        description: str | None,
        due_date: date | None,
        announcement_id: uuid.UUID | None,
        assignee_user_ids: list[uuid.UUID],
    ):
        if actor_role not in HR_ROLES:
            raise Forbidden()
        task = await self._tasks.create(
            created_by_user_id=actor_user_id,
            announcement_id=announcement_id,
            title=title.strip(),
            description=description,
            due_date=due_date,
        )
        await self._assignments.assign(task_id=task.id, user_ids=assignee_user_ids)
        return task

    async def my_tasks(
        self,
        *,
        actor_user_id: uuid.UUID,
        include_completed: bool,
        limit: int,
        offset: int,
    ):
        return await self._assignments.list_for_user(
            user_id=actor_user_id,
            include_completed=include_completed,
            limit=limit,
            offset=offset,
        )

    async def complete(self, task_id: uuid.UUID, *, actor_user_id: uuid.UUID) -> None:
        ok = await self._assignments.complete(task_id=task_id, user_id=actor_user_id)
        if not ok:
            raise NotFound()

    async def new_count(self, *, actor_user_id: uuid.UUID) -> int:
        return await self._assignments.unseen_count(user_id=actor_user_id)

    async def mark_my_tasks_seen(self, *, actor_user_id: uuid.UUID) -> None:
        await self._assignments.mark_all_seen(user_id=actor_user_id)

    async def list_all(self, *, actor_role: str, limit: int, offset: int):
        if actor_role not in HR_ROLES:
            raise Forbidden()
        return await self._tasks.list_all(limit=limit, offset=offset)
