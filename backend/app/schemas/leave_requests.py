from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class LeaveRequestCreate(BaseModel):
    request_type: str = Field(pattern="^(vacation|day_off|sick)$")
    start_date: date
    end_date: date
    reason: str | None = Field(default=None, max_length=512)


class LeaveRequestResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    request_type: str
    status: str
    start_date: date
    end_date: date
    reason: str | None
    hr_comment: str | None


class LeaveRequestAction(BaseModel):
    hr_comment: str | None = Field(default=None, max_length=512)


class LeaveRequestReject(BaseModel):
    hr_comment: str = Field(min_length=1, max_length=512)


class LeaveRequestEventResponse(BaseModel):
    id: uuid.UUID
    request_id: uuid.UUID
    actor_user_id: uuid.UUID
    from_status: str | None
    to_status: str
    comment: str | None
    created_at: datetime

