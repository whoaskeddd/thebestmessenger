from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.auth.security import get_current_user, require_role
from app.api.deps import DbSessionDep
from app.domain.leave_requests.exceptions import Forbidden, InvalidTransition, NotFound
from app.domain.leave_requests.use_cases import LeaveRequestsService
from app.infrastructure.leave_requests.repositories import (
    SQLAlchemyLeaveRequestEventsRepository,
    SQLAlchemyLeaveRequestReadsRepository,
    SQLAlchemyLeaveRequestsRepository,
)
from app.schemas.common import CountResponse
from app.schemas.leave_requests import (
    LeaveRequestAction,
    LeaveRequestCreate,
    LeaveRequestEventResponse,
    LeaveRequestReject,
    LeaveRequestResponse,
)


router = APIRouter(prefix="/leave-requests", tags=["leave-requests"], dependencies=[Depends(get_current_user)])


def _service(session: DbSessionDep) -> LeaveRequestsService:
    return LeaveRequestsService(
        requests=SQLAlchemyLeaveRequestsRepository(session),
        events=SQLAlchemyLeaveRequestEventsRepository(session),
        reads=SQLAlchemyLeaveRequestReadsRepository(session),
    )


def _req_response(req) -> LeaveRequestResponse:
    return LeaveRequestResponse(
        id=req.id,
        user_id=req.user_id,
        request_type=req.request_type,
        status=req.status,
        start_date=req.start_date,
        end_date=req.end_date,
        reason=req.reason,
        hr_comment=req.hr_comment,
    )


def _event_response(ev) -> LeaveRequestEventResponse:
    return LeaveRequestEventResponse(
        id=ev.id,
        request_id=ev.request_id,
        actor_user_id=ev.actor_user_id,
        from_status=ev.from_status,
        to_status=ev.to_status,
        comment=ev.comment,
        created_at=ev.created_at,
    )


@router.post("", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_leave_request(payload: LeaveRequestCreate, session: DbSessionDep, user=Depends(get_current_user)):
    req = await _service(session).create(
        actor_user_id=user.id,
        request_type=payload.request_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        reason=payload.reason,
    )
    await session.commit()
    return _req_response(req)


@router.get("", response_model=list[LeaveRequestResponse])
async def list_leave_requests(
    session: DbSessionDep,
    user=Depends(get_current_user),
    status_filter: str | None = Query(default=None, alias="status"),
    type_filter: str | None = Query(default=None, alias="type"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    items = await _service(session).list(
        actor_user_id=user.id,
        actor_role=user.role,
        status=status_filter,
        request_type=type_filter,
        limit=limit,
        offset=offset,
    )
    return [_req_response(i) for i in items]


@router.get(
    "/unread-count",
    response_model=CountResponse,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def unread_count(session: DbSessionDep, user=Depends(get_current_user)) -> CountResponse:
    try:
        count = await _service(session).unread_count(actor_user_id=user.id, actor_role=user.role)
        return CountResponse(count=count)
    except Forbidden as exc:
        raise HTTPException(status_code=403, detail="forbidden") from exc


@router.post(
    "/mark-read",
    response_model=CountResponse,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def mark_read(session: DbSessionDep, user=Depends(get_current_user)) -> CountResponse:
    try:
        await _service(session).mark_all_read(actor_user_id=user.id, actor_role=user.role)
        await session.commit()
        # Return current unread count after marking
        count = await _service(session).unread_count(actor_user_id=user.id, actor_role=user.role)
        return CountResponse(count=count)
    except Forbidden as exc:
        await session.rollback()
        raise HTTPException(status_code=403, detail="forbidden") from exc


@router.get("/{request_id:uuid}", response_model=LeaveRequestResponse)
async def get_leave_request(request_id: uuid.UUID, session: DbSessionDep, user=Depends(get_current_user)):
    try:
        req = await _service(session).get(request_id, actor_user_id=user.id, actor_role=user.role)
        return _req_response(req)
    except NotFound as exc:
        raise HTTPException(status_code=404, detail="leave request not found") from exc
    except Forbidden as exc:
        raise HTTPException(status_code=403, detail="forbidden") from exc


@router.get("/{request_id:uuid}/history", response_model=list[LeaveRequestEventResponse])
async def history(request_id: uuid.UUID, session: DbSessionDep, user=Depends(get_current_user)):
    try:
        events = await _service(session).history(request_id, actor_user_id=user.id, actor_role=user.role)
        return [_event_response(e) for e in events]
    except NotFound as exc:
        raise HTTPException(status_code=404, detail="leave request not found") from exc
    except Forbidden as exc:
        raise HTTPException(status_code=403, detail="forbidden") from exc


@router.post(
    "/{request_id:uuid}/approve",
    response_model=LeaveRequestResponse,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def approve(request_id: uuid.UUID, payload: LeaveRequestAction, session: DbSessionDep, user=Depends(get_current_user)):
    try:
        req = await _service(session).approve(
            request_id,
            actor_user_id=user.id,
            actor_role=user.role,
            hr_comment=payload.hr_comment,
        )
        await session.commit()
        return _req_response(req)
    except NotFound as exc:
        await session.rollback()
        raise HTTPException(status_code=404, detail="leave request not found") from exc
    except InvalidTransition as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="invalid status transition") from exc


@router.post(
    "/{request_id:uuid}/reject",
    response_model=LeaveRequestResponse,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def reject(request_id: uuid.UUID, payload: LeaveRequestReject, session: DbSessionDep, user=Depends(get_current_user)):
    try:
        req = await _service(session).reject(
            request_id,
            actor_user_id=user.id,
            actor_role=user.role,
            hr_comment=payload.hr_comment,
        )
        await session.commit()
        return _req_response(req)
    except NotFound as exc:
        await session.rollback()
        raise HTTPException(status_code=404, detail="leave request not found") from exc
    except InvalidTransition as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="invalid status transition") from exc


@router.post("/{request_id:uuid}/cancel", response_model=LeaveRequestResponse)
async def cancel(request_id: uuid.UUID, session: DbSessionDep, user=Depends(get_current_user)):
    try:
        req = await _service(session).cancel(request_id, actor_user_id=user.id, actor_role=user.role)
        await session.commit()
        return _req_response(req)
    except NotFound as exc:
        await session.rollback()
        raise HTTPException(status_code=404, detail="leave request not found") from exc
    except Forbidden as exc:
        await session.rollback()
        raise HTTPException(status_code=403, detail="forbidden") from exc
    except InvalidTransition as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="invalid status transition") from exc
