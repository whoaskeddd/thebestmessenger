from __future__ import annotations

import uuid
from datetime import date

from pydantic import BaseModel, EmailStr, Field


class DepartmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)


class DepartmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=128)


class DepartmentResponse(BaseModel):
    id: uuid.UUID
    name: str


class EmployeeCreate(BaseModel):
    user_id: uuid.UUID | None = None
    first_name: str = Field(min_length=1, max_length=64)
    last_name: str = Field(min_length=1, max_length=64)
    middle_name: str | None = Field(default=None, max_length=64)
    work_email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=32)
    position: str | None = Field(default=None, max_length=128)
    hire_date: date | None = None
    department_ids: list[uuid.UUID] = Field(default_factory=list)


class EmployeeUpdate(BaseModel):
    user_id: uuid.UUID | None = None
    first_name: str | None = Field(default=None, min_length=1, max_length=64)
    last_name: str | None = Field(default=None, min_length=1, max_length=64)
    middle_name: str | None = Field(default=None, max_length=64)
    work_email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=32)
    position: str | None = Field(default=None, max_length=128)
    hire_date: date | None = None
    is_active: bool | None = None
    department_ids: list[uuid.UUID] | None = None


class EmployeeSelfUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=64)
    last_name: str | None = Field(default=None, min_length=1, max_length=64)
    middle_name: str | None = Field(default=None, max_length=64)
    phone: str | None = Field(default=None, max_length=32)
    position: str | None = Field(default=None, max_length=128)


class EmployeeResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None
    first_name: str
    last_name: str
    middle_name: str | None
    work_email: EmailStr | None
    phone: str | None
    position: str | None
    hire_date: date | None
    is_active: bool
    departments: list[DepartmentResponse]
