import uuid
from dataclasses import dataclass
from datetime import UTC, date, datetime

import pytest

from app.domain.leave_requests.exceptions import Forbidden, InvalidTransition, NotFound
from app.domain.leave_requests.use_cases import LeaveRequestsService


@dataclass
class LeaveRequest:
    id: uuid.UUID
    user_id: uuid.UUID
    request_type: str
    status: str
    start_date: date
    end_date: date
    reason: str | None
    hr_comment: str | None


@dataclass
class Event:
    id: uuid.UUID
    request_id: uuid.UUID
    actor_user_id: uuid.UUID
    from_status: str | None
    to_status: str
    comment: str | None
    created_at: datetime


class FakeRequestsRepo:
    def __init__(self) -> None:
        self._items: dict[uuid.UUID, LeaveRequest] = {}

    async def create(self, *, user_id, request_type, start_date, end_date, reason):
        req = LeaveRequest(
            id=uuid.uuid4(),
            user_id=user_id,
            request_type=request_type,
            status="submitted",
            start_date=start_date,
            end_date=end_date,
            reason=reason,
            hr_comment=None,
        )
        self._items[req.id] = req
        return req

    async def get(self, request_id):
        return self._items.get(request_id)

    async def list(self, *, user_id, status, request_type, limit, offset):
        items = list(self._items.values())
        if user_id is not None:
            items = [i for i in items if i.user_id == user_id]
        if status is not None:
            items = [i for i in items if i.status == status]
        if request_type is not None:
            items = [i for i in items if i.request_type == request_type]
        return items[offset : offset + limit]

    async def set_status(self, request_id, *, status, hr_comment):
        req = self._items.get(request_id)
        if req is None:
            return None
        req.status = status
        req.hr_comment = hr_comment
        return req


class FakeEventsRepo:
    def __init__(self) -> None:
        self._events: list[Event] = []

    async def add_event(self, *, request_id, actor_user_id, from_status, to_status, comment):
        ev = Event(
            id=uuid.uuid4(),
            request_id=request_id,
            actor_user_id=actor_user_id,
            from_status=from_status,
            to_status=to_status,
            comment=comment,
            created_at=datetime.now(UTC),
        )
        self._events.append(ev)
        return ev

    async def list_by_request(self, request_id):
        return [e for e in self._events if e.request_id == request_id]


@pytest.mark.asyncio
async def test_employee_create_and_cancel() -> None:
    reqs = FakeRequestsRepo()
    events = FakeEventsRepo()
    service = LeaveRequestsService(requests=reqs, events=events)

    user_id = uuid.uuid4()
    req = await service.create(
        actor_user_id=user_id,
        request_type="vacation",
        start_date=date(2026, 4, 1),
        end_date=date(2026, 4, 2),
        reason=None,
    )
    assert req.status == "submitted"

    canceled = await service.cancel(req.id, actor_user_id=user_id, actor_role="employee")
    assert canceled.status == "canceled"


@pytest.mark.asyncio
async def test_hr_approve_and_reject_transitions() -> None:
    reqs = FakeRequestsRepo()
    events = FakeEventsRepo()
    service = LeaveRequestsService(requests=reqs, events=events)

    user_id = uuid.uuid4()
    req = await service.create(
        actor_user_id=user_id,
        request_type="sick",
        start_date=date(2026, 4, 1),
        end_date=date(2026, 4, 1),
        reason="",
    )

    hr_id = uuid.uuid4()
    approved = await service.approve(req.id, actor_user_id=hr_id, actor_role="hr", hr_comment=None)
    assert approved.status == "approved"

    with pytest.raises(InvalidTransition):
        await service.reject(req.id, actor_user_id=hr_id, actor_role="hr", hr_comment="no")


@pytest.mark.asyncio
async def test_forbidden_access() -> None:
    reqs = FakeRequestsRepo()
    events = FakeEventsRepo()
    service = LeaveRequestsService(requests=reqs, events=events)

    owner = uuid.uuid4()
    other = uuid.uuid4()
    req = await service.create(
        actor_user_id=owner,
        request_type="day_off",
        start_date=date(2026, 4, 1),
        end_date=date(2026, 4, 1),
        reason=None,
    )

    with pytest.raises(Forbidden):
        await service.get(req.id, actor_user_id=other, actor_role="employee")

    with pytest.raises(Forbidden):
        await service.approve(req.id, actor_user_id=other, actor_role="employee", hr_comment=None)


@pytest.mark.asyncio
async def test_not_found() -> None:
    reqs = FakeRequestsRepo()
    events = FakeEventsRepo()
    service = LeaveRequestsService(requests=reqs, events=events)

    with pytest.raises(NotFound):
        await service.get(uuid.uuid4(), actor_user_id=uuid.uuid4(), actor_role="hr")
