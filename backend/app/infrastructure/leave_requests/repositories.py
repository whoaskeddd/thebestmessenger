from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import date

from sqlalchemy import and_, func, literal, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.leave_requests.repositories import (
    LeaveRequestEventsRepository,
    LeaveRequestReadsRepository,
    LeaveRequestsRepository,
)
from app.infrastructure.leave_requests.models import LeaveRequest, LeaveRequestEvent, LeaveRequestRead


class SQLAlchemyLeaveRequestsRepository(LeaveRequestsRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        user_id: uuid.UUID,
        request_type: str,
        start_date: date,
        end_date: date,
        reason: str | None,
    ) -> LeaveRequest:
        req = LeaveRequest(
            user_id=user_id,
            request_type=request_type,
            status="submitted",
            start_date=start_date,
            end_date=end_date,
            reason=reason,
        )
        self._session.add(req)
        await self._session.flush()
        return req

    async def get(self, request_id: uuid.UUID) -> LeaveRequest | None:
        result = await self._session.execute(select(LeaveRequest).where(LeaveRequest.id == request_id))
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        user_id: uuid.UUID | None,
        status: str | None,
        request_type: str | None,
        limit: int,
        offset: int,
    ) -> Sequence[LeaveRequest]:
        stmt = select(LeaveRequest).order_by(LeaveRequest.created_at.desc()).limit(limit).offset(offset)
        if user_id is not None:
            stmt = stmt.where(LeaveRequest.user_id == user_id)
        if status is not None:
            stmt = stmt.where(LeaveRequest.status == status)
        if request_type is not None:
            stmt = stmt.where(LeaveRequest.request_type == request_type)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def set_status(
        self,
        request_id: uuid.UUID,
        *,
        status: str,
        hr_comment: str | None,
    ) -> LeaveRequest | None:
        await self._session.execute(
            update(LeaveRequest)
            .where(LeaveRequest.id == request_id)
            .values(status=status, hr_comment=hr_comment)
        )
        return await self.get(request_id)


class SQLAlchemyLeaveRequestEventsRepository(LeaveRequestEventsRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add_event(
        self,
        *,
        request_id: uuid.UUID,
        actor_user_id: uuid.UUID,
        from_status: str | None,
        to_status: str,
        comment: str | None,
    ) -> LeaveRequestEvent:
        event = LeaveRequestEvent(
            request_id=request_id,
            actor_user_id=actor_user_id,
            from_status=from_status,
            to_status=to_status,
            comment=comment,
        )
        self._session.add(event)
        await self._session.flush()
        return event

    async def list_by_request(self, request_id: uuid.UUID) -> Sequence[LeaveRequestEvent]:
        stmt = (
            select(LeaveRequestEvent)
            .where(LeaveRequestEvent.request_id == request_id)
            .order_by(LeaveRequestEvent.created_at.asc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())


class SQLAlchemyLeaveRequestReadsRepository(LeaveRequestReadsRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def unread_count_for_hr(self, *, user_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(LeaveRequest)
            .where(LeaveRequest.status == "submitted")
            .where(
                ~select(LeaveRequestRead.id)
                .where(and_(LeaveRequestRead.request_id == LeaveRequest.id, LeaveRequestRead.user_id == user_id))
                .exists()
            )
        )
        result = await self._session.execute(stmt)
        return int(result.scalar() or 0)

    async def mark_all_submitted_read(self, *, user_id: uuid.UUID) -> None:
        # Insert "read" rows for all currently submitted requests, ignore conflicts.
        stmt = (
            insert(LeaveRequestRead.__table__)
            .from_select(
                ["request_id", "user_id"],
                select(LeaveRequest.id, literal(user_id)).where(LeaveRequest.status == "submitted"),
            )
            .on_conflict_do_nothing(constraint="uq_leave_request_read")
        )
        await self._session.execute(stmt)
