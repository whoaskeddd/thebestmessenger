from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import date
from typing import Protocol


UNSET = object()


class DepartmentDTO(Protocol):
    id: uuid.UUID
    name: str


class EmployeeDTO(Protocol):
    id: uuid.UUID
    user_id: uuid.UUID | None
    first_name: str
    last_name: str
    middle_name: str | None
    work_email: str | None
    phone: str | None
    position: str | None
    hire_date: date | None
    is_active: bool
    departments: Sequence[DepartmentDTO]


class DepartmentsRepository(Protocol):
    async def create(self, *, name: str) -> DepartmentDTO: ...

    async def get(self, department_id: uuid.UUID) -> DepartmentDTO | None: ...

    async def list(
        self, *, search: str | None, limit: int, offset: int
    ) -> Sequence[DepartmentDTO]: ...

    async def update(self, department_id: uuid.UUID, *, name: str | None) -> DepartmentDTO | None: ...

    async def delete(self, department_id: uuid.UUID) -> bool: ...


class EmployeesRepository(Protocol):
    async def create(
        self,
        *,
        user_id: uuid.UUID | None,
        first_name: str,
        last_name: str,
        middle_name: str | None,
        work_email: str | None,
        phone: str | None,
        position: str | None,
        hire_date: date | None,
        department_ids: Sequence[uuid.UUID],
    ) -> EmployeeDTO: ...

    async def get(self, employee_id: uuid.UUID) -> EmployeeDTO | None: ...

    async def get_by_user_id(self, user_id: uuid.UUID) -> EmployeeDTO | None: ...

    async def get_by_work_email(self, work_email: str) -> EmployeeDTO | None: ...

    async def list(
        self,
        *,
        search: str | None,
        department_id: uuid.UUID | None,
        limit: int,
        offset: int,
    ) -> Sequence[EmployeeDTO]: ...

    async def update(
        self,
        employee_id: uuid.UUID,
        *,
        user_id: uuid.UUID | None | object,
        first_name: str | None,
        last_name: str | None,
        middle_name: str | None | object,
        work_email: str | None | object,
        phone: str | None | object,
        position: str | None | object,
        hire_date: date | None | object,
        is_active: bool | None,
        department_ids: Sequence[uuid.UUID] | None,
    ) -> EmployeeDTO | None: ...

    async def delete(self, employee_id: uuid.UUID) -> bool: ...
