from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError

from app.api.auth.security import get_current_user, require_role
from app.api.deps import DbSessionDep
from app.domain.announcements.exceptions import Forbidden, NotFound
from app.domain.announcements.use_cases import AnnouncementsService
from app.infrastructure.announcements.repositories import SQLAlchemyAnnouncementsRepository
from app.schemas.announcements import AnnouncementCreate, AnnouncementResponse


router = APIRouter(prefix="/announcements", tags=["announcements"], dependencies=[Depends(get_current_user)])


def _service(session: DbSessionDep) -> AnnouncementsService:
    return AnnouncementsService(announcements=SQLAlchemyAnnouncementsRepository(session))


def _resp(ann) -> AnnouncementResponse:
    return AnnouncementResponse(
        id=ann.id,
        created_by_user_id=ann.created_by_user_id,
        title=ann.title,
        body=ann.body,
        is_global=ann.is_global,
        created_at=ann.created_at,
    )


@router.post(
    "",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def create(payload: AnnouncementCreate, session: DbSessionDep, user=Depends(get_current_user)):
    try:
        ann = await _service(session).create(
            actor_user_id=user.id,
            actor_role=user.role,
            title=payload.title,
            body=payload.body,
            is_global=payload.is_global,
            department_ids=payload.department_ids,
        )
        await session.commit()
        return _resp(ann)
    except Forbidden as exc:
        await session.rollback()
        raise HTTPException(status_code=403, detail="forbidden") from exc
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="invalid departments") from exc


@router.get("", response_model=list[AnnouncementResponse])
async def list_anns(
    session: DbSessionDep,
    user=Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    items = await _service(session).list(actor_user_id=user.id, actor_role=user.role, limit=limit, offset=offset)
    return [_resp(a) for a in items]


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
async def get_one(announcement_id: uuid.UUID, session: DbSessionDep, user=Depends(get_current_user)):
    try:
        ann = await _service(session).get(announcement_id, actor_user_id=user.id, actor_role=user.role)
        return _resp(ann)
    except NotFound as exc:
        raise HTTPException(status_code=404, detail="announcement not found") from exc


@router.post("/{announcement_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_read(announcement_id: uuid.UUID, session: DbSessionDep, user=Depends(get_current_user)) -> None:
    try:
        await _service(session).mark_read(announcement_id, actor_user_id=user.id, actor_role=user.role)
        await session.commit()
    except NotFound as exc:
        await session.rollback()
        raise HTTPException(status_code=404, detail="announcement not found") from exc

