from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import UTC, datetime

from sqlalchemy import and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.hr_tasks.repositories import HrTaskAssignmentsRepository, HrTasksRepository
from app.infrastructure.hr_tasks.models import HrTask, HrTaskAssignment


class SQLAlchemyHrTasksRepository(HrTasksRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        created_by_user_id: uuid.UUID,
        announcement_id: uuid.UUID | None,
        title: str,
        description: str | None,
        due_date,
    ) -> HrTask:
        task = HrTask(
            created_by_user_id=created_by_user_id,
            announcement_id=announcement_id,
            title=title,
            description=description,
            due_date=due_date,
        )
        self._session.add(task)
        await self._session.flush()
        return task

    async def get(self, task_id: uuid.UUID) -> HrTask | None:
        result = await self._session.execute(select(HrTask).where(HrTask.id == task_id))
        return result.scalar_one_or_none()

    async def list_all(self, *, limit: int, offset: int) -> Sequence[HrTask]:
        stmt = select(HrTask).order_by(HrTask.created_at.desc()).limit(limit).offset(offset)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())


class SQLAlchemyHrTaskAssignmentsRepository(HrTaskAssignmentsRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def assign(self, *, task_id: uuid.UUID, user_ids: Sequence[uuid.UUID]) -> None:
        for uid in user_ids:
            self._session.add(HrTaskAssignment(task_id=task_id, user_id=uid))
        await self._session.flush()

    async def list_for_user(
        self, *, user_id: uuid.UUID, include_completed: bool, limit: int, offset: int
    ) -> Sequence[tuple[HrTask, HrTaskAssignment]]:
        stmt = (
            select(HrTask, HrTaskAssignment)
            .join(HrTaskAssignment, HrTaskAssignment.task_id == HrTask.id)
            .where(HrTaskAssignment.user_id == user_id)
            .order_by(HrTask.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        if not include_completed:
            stmt = stmt.where(HrTaskAssignment.completed_at.is_(None))
        result = await self._session.execute(stmt)
        return list(result.all())

    async def complete(self, *, task_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        now = datetime.now(UTC)
        result = await self._session.execute(
            update(HrTaskAssignment)
            .where(and_(HrTaskAssignment.task_id == task_id, HrTaskAssignment.user_id == user_id))
            .values(completed_at=now)
        )
        return result.rowcount > 0

    async def unseen_count(self, *, user_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(HrTaskAssignment)
            .where(
                and_(
                    HrTaskAssignment.user_id == user_id,
                    HrTaskAssignment.completed_at.is_(None),
                    HrTaskAssignment.seen_at.is_(None),
                )
            )
        )
        result = await self._session.execute(stmt)
        return int(result.scalar() or 0)

    async def mark_all_seen(self, *, user_id: uuid.UUID) -> None:
        now = datetime.now(UTC)
        await self._session.execute(
            update(HrTaskAssignment)
            .where(and_(HrTaskAssignment.user_id == user_id, HrTaskAssignment.seen_at.is_(None)))
            .values(seen_at=now)
        )
