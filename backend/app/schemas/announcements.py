from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=10_000)
    is_global: bool = False
    department_ids: list[uuid.UUID] = Field(default_factory=list)


class AnnouncementResponse(BaseModel):
    id: uuid.UUID
    created_by_user_id: uuid.UUID
    title: str
    body: str
    is_global: bool
    created_at: datetime

