from __future__ import annotations

import uuid
from datetime import date

from app.domain.leave_requests.exceptions import Forbidden, InvalidTransition, NotFound
from app.domain.leave_requests.repositories import LeaveRequestEventsRepository, LeaveRequestsRepository


HR_ROLES = {"admin", "hr"}


class LeaveRequestsService:
    def __init__(self, *, requests: LeaveRequestsRepository, events: LeaveRequestEventsRepository) -> None:
        self._requests = requests
        self._events = events

    async def create(
        self,
        *,
        actor_user_id: uuid.UUID,
        request_type: str,
        start_date: date,
        end_date: date,
        reason: str | None,
    ):
        req = await self._requests.create(
            user_id=actor_user_id,
            request_type=request_type,
            start_date=start_date,
            end_date=end_date,
            reason=reason,
        )
        await self._events.add_event(
            request_id=req.id,
            actor_user_id=actor_user_id,
            from_status=None,
            to_status=req.status,
            comment=None,
        )
        return req

    async def get(self, request_id: uuid.UUID, *, actor_user_id: uuid.UUID, actor_role: str):
        req = await self._requests.get(request_id)
        if req is None:
            raise NotFound()
        if actor_role not in HR_ROLES and req.user_id != actor_user_id:
            raise Forbidden()
        return req

    async def list(
        self,
        *,
        actor_user_id: uuid.UUID,
        actor_role: str,
        status: str | None,
        request_type: str | None,
        limit: int,
        offset: int,
    ):
        user_filter = None if actor_role in HR_ROLES else actor_user_id
        return await self._requests.list(
            user_id=user_filter,
            status=status,
            request_type=request_type,
            limit=limit,
            offset=offset,
        )

    async def history(self, request_id: uuid.UUID, *, actor_user_id: uuid.UUID, actor_role: str):
        _ = await self.get(request_id, actor_user_id=actor_user_id, actor_role=actor_role)
        return await self._events.list_by_request(request_id)

    async def approve(
        self,
        request_id: uuid.UUID,
        *,
        actor_user_id: uuid.UUID,
        actor_role: str,
        hr_comment: str | None,
    ):
        if actor_role not in HR_ROLES:
            raise Forbidden()
        req = await self._requests.get(request_id)
        if req is None:
            raise NotFound()
        if req.status != "submitted":
            raise InvalidTransition()
        updated = await self._requests.set_status(request_id, status="approved", hr_comment=hr_comment)
        if updated is None:
            raise NotFound()
        await self._events.add_event(
            request_id=request_id,
            actor_user_id=actor_user_id,
            from_status=req.status,
            to_status=updated.status,
            comment=hr_comment,
        )
        return updated

    async def reject(
        self,
        request_id: uuid.UUID,
        *,
        actor_user_id: uuid.UUID,
        actor_role: str,
        hr_comment: str,
    ):
        if actor_role not in HR_ROLES:
            raise Forbidden()
        req = await self._requests.get(request_id)
        if req is None:
            raise NotFound()
        if req.status != "submitted":
            raise InvalidTransition()
        updated = await self._requests.set_status(request_id, status="rejected", hr_comment=hr_comment)
        if updated is None:
            raise NotFound()
        await self._events.add_event(
            request_id=request_id,
            actor_user_id=actor_user_id,
            from_status=req.status,
            to_status=updated.status,
            comment=hr_comment,
        )
        return updated

    async def cancel(self, request_id: uuid.UUID, *, actor_user_id: uuid.UUID, actor_role: str):
        req = await self._requests.get(request_id)
        if req is None:
            raise NotFound()
        if actor_role not in HR_ROLES and req.user_id != actor_user_id:
            raise Forbidden()
        if req.status not in {"submitted"}:
            raise InvalidTransition()
        updated = await self._requests.set_status(request_id, status="canceled", hr_comment=req.hr_comment)
        if updated is None:
            raise NotFound()
        await self._events.add_event(
            request_id=request_id,
            actor_user_id=actor_user_id,
            from_status=req.status,
            to_status=updated.status,
            comment=None,
        )
        return updated

