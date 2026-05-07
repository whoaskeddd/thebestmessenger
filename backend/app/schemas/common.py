from __future__ import annotations

from pydantic import BaseModel, Field


class CountResponse(BaseModel):
    count: int = Field(ge=0)

