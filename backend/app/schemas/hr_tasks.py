from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class HrTaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    due_date: date | None = None
    announcement_id: uuid.UUID | None = None
    assignee_user_ids: list[uuid.UUID] = Field(default_factory=list)


class HrTaskResponse(BaseModel):
    id: uuid.UUID
    created_by_user_id: uuid.UUID
    announcement_id: uuid.UUID | None
    title: str
    description: str | None
    due_date: date | None
    created_at: datetime


class MyTaskResponse(BaseModel):
    task: HrTaskResponse
    completed_at: datetime | None


class CompleteResponse(BaseModel):
    status: str = "ok"

