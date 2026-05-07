from __future__ import annotations

import uuid
from collections.abc import Sequence

from sqlalchemy import and_, exists, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.announcements.repositories import AnnouncementsRepository
from app.infrastructure.announcements.models import Announcement, AnnouncementRead, announcement_departments
from app.infrastructure.employees.models import Employee, employee_departments


HR_ROLES = {"admin", "hr"}


class SQLAlchemyAnnouncementsRepository(AnnouncementsRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        created_by_user_id: uuid.UUID,
        title: str,
        body: str,
        is_global: bool,
        department_ids: Sequence[uuid.UUID],
    ) -> Announcement:
        ann = Announcement(
            created_by_user_id=created_by_user_id,
            title=title,
            body=body,
            is_global=is_global,
        )
        self._session.add(ann)
        await self._session.flush()

        if not is_global and department_ids:
            rows = [{"announcement_id": ann.id, "department_id": did} for did in department_ids]
            await self._session.execute(announcement_departments.insert().values(rows))

        return ann

    def _visibility_clause(self, *, actor_user_id: uuid.UUID):
        dept_ids_subq = (
            select(employee_departments.c.department_id)
            .join(Employee, Employee.id == employee_departments.c.employee_id)
            .where(Employee.user_id == actor_user_id)
        )

        targeted_exists = exists(
            select(1).select_from(announcement_departments).where(
                and_(
                    announcement_departments.c.announcement_id == Announcement.id,
                    announcement_departments.c.department_id.in_(dept_ids_subq),
                )
            )
        )

        return or_(Announcement.is_global.is_(True), targeted_exists)

    async def get_for_user(
        self,
        announcement_id: uuid.UUID,
        *,
        actor_user_id: uuid.UUID,
        actor_role: str,
    ) -> Announcement | None:
        stmt = select(Announcement).where(Announcement.id == announcement_id)
        if actor_role not in HR_ROLES:
            stmt = stmt.where(self._visibility_clause(actor_user_id=actor_user_id))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_for_user(
        self,
        *,
        actor_user_id: uuid.UUID,
        actor_role: str,
        limit: int,
        offset: int,
    ) -> Sequence[Announcement]:
        stmt = select(Announcement).order_by(Announcement.created_at.desc()).limit(limit).offset(offset)
        if actor_role not in HR_ROLES:
            stmt = stmt.where(self._visibility_clause(actor_user_id=actor_user_id))
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def mark_read(self, announcement_id: uuid.UUID, *, user_id: uuid.UUID) -> None:
        stmt = (
            insert(AnnouncementRead)
            .values(announcement_id=announcement_id, user_id=user_id)
            .on_conflict_do_nothing(constraint="uq_announcement_reads")
        )
        await self._session.execute(stmt)

    async def is_read(self, announcement_id: uuid.UUID, *, user_id: uuid.UUID) -> bool:
        stmt = select(AnnouncementRead.id).where(
            AnnouncementRead.announcement_id == announcement_id,
            AnnouncementRead.user_id == user_id,
        )
        result = await self._session.execute(stmt)
        return result.first() is not None
