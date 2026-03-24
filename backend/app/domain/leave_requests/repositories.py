from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import date, datetime
from typing import Protocol


class LeaveRequestDTO(Protocol):
    id: uuid.UUID
    user_id: uuid.UUID
    request_type: str
    status: str
    start_date: date
    end_date: date
    reason: str | None
    hr_comment: str | None


class LeaveRequestEventDTO(Protocol):
    id: uuid.UUID
    request_id: uuid.UUID
    actor_user_id: uuid.UUID
    from_status: str | None
    to_status: str
    comment: str | None
    created_at: datetime


class LeaveRequestsRepository(Protocol):
    async def create(
        self,
        *,
        user_id: uuid.UUID,
        request_type: str,
        start_date: date,
        end_date: date,
        reason: str | None,
    ) -> LeaveRequestDTO: ...

    async def get(self, request_id: uuid.UUID) -> LeaveRequestDTO | None: ...

    async def list(
        self,
        *,
        user_id: uuid.UUID | None,
        status: str | None,
        request_type: str | None,
        limit: int,
        offset: int,
    ) -> Sequence[LeaveRequestDTO]: ...

    async def set_status(
        self,
        request_id: uuid.UUID,
        *,
        status: str,
        hr_comment: str | None,
    ) -> LeaveRequestDTO | None: ...


class LeaveRequestEventsRepository(Protocol):
    async def add_event(
        self,
        *,
        request_id: uuid.UUID,
        actor_user_id: uuid.UUID,
        from_status: str | None,
        to_status: str,
        comment: str | None,
    ) -> LeaveRequestEventDTO: ...

    async def list_by_request(self, request_id: uuid.UUID) -> Sequence[LeaveRequestEventDTO]: ...

