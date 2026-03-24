from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError

from app.api.auth.security import get_current_user, require_role
from app.api.deps import DbSessionDep
from app.domain.hr_tasks.exceptions import Forbidden, NotFound
from app.domain.hr_tasks.use_cases import HrTasksService
from app.infrastructure.hr_tasks.repositories import (
    SQLAlchemyHrTaskAssignmentsRepository,
    SQLAlchemyHrTasksRepository,
)
from app.schemas.hr_tasks import CompleteResponse, HrTaskCreate, HrTaskResponse, MyTaskResponse


router = APIRouter(prefix="/hr-tasks", tags=["hr-tasks"], dependencies=[Depends(get_current_user)])


def _service(session: DbSessionDep) -> HrTasksService:
    return HrTasksService(
        tasks=SQLAlchemyHrTasksRepository(session),
        assignments=SQLAlchemyHrTaskAssignmentsRepository(session),
    )


def _task_resp(task) -> HrTaskResponse:
    return HrTaskResponse(
        id=task.id,
        created_by_user_id=task.created_by_user_id,
        announcement_id=task.announcement_id,
        title=task.title,
        description=task.description,
        due_date=task.due_date,
        created_at=task.created_at,
    )


@router.post(
    "",
    response_model=HrTaskResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def create(payload: HrTaskCreate, session: DbSessionDep, user=Depends(get_current_user)) -> HrTaskResponse:
    try:
        task = await _service(session).create(
            actor_user_id=user.id,
            actor_role=user.role,
            title=payload.title,
            description=payload.description,
            due_date=payload.due_date,
            announcement_id=payload.announcement_id,
            assignee_user_ids=payload.assignee_user_ids,
        )
        await session.commit()
        return _task_resp(task)
    except Forbidden as exc:
        await session.rollback()
        raise HTTPException(status_code=403, detail="forbidden") from exc
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="invalid assignees") from exc


@router.get("/my", response_model=list[MyTaskResponse])
async def my_tasks(
    session: DbSessionDep,
    user=Depends(get_current_user),
    include_completed: bool = False,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[MyTaskResponse]:
    items = await _service(session).my_tasks(
        actor_user_id=user.id,
        include_completed=include_completed,
        limit=limit,
        offset=offset,
    )
    return [
        MyTaskResponse(task=_task_resp(task), completed_at=assignment.completed_at)
        for task, assignment in items
    ]


@router.post("/{task_id}/complete", response_model=CompleteResponse)
async def complete(task_id: uuid.UUID, session: DbSessionDep, user=Depends(get_current_user)) -> CompleteResponse:
    try:
        await _service(session).complete(task_id, actor_user_id=user.id)
        await session.commit()
        return CompleteResponse()
    except NotFound as exc:
        await session.rollback()
        raise HTTPException(status_code=404, detail="task not found") from exc


@router.get(
    "",
    response_model=list[HrTaskResponse],
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def list_all(
    session: DbSessionDep,
    user=Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[HrTaskResponse]:
    try:
        items = await _service(session).list_all(actor_role=user.role, limit=limit, offset=offset)
        return [_task_resp(t) for t in items]
    except Forbidden as exc:
        raise HTTPException(status_code=403, detail="forbidden") from exc

