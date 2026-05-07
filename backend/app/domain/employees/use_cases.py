from __future__ import annotations

import uuid
from datetime import date

from app.domain.employees.exceptions import NotFound
from app.domain.employees.repositories import UNSET, DepartmentsRepository, EmployeesRepository


class EmployeesService:
    def __init__(self, *, employees: EmployeesRepository, departments: DepartmentsRepository) -> None:
        self._employees = employees
        self._departments = departments

    async def create_department(self, *, name: str):
        return await self._departments.create(name=name.strip())

    async def list_departments(self, *, search: str | None, limit: int, offset: int):
        return await self._departments.list(search=search, limit=limit, offset=offset)

    async def get_department(self, department_id: uuid.UUID):
        dep = await self._departments.get(department_id)
        if dep is None:
            raise NotFound()
        return dep

    async def update_department(self, department_id: uuid.UUID, *, name: str | None):
        dep = await self._departments.update(department_id, name=name.strip() if name is not None else None)
        if dep is None:
            raise NotFound()
        return dep

    async def delete_department(self, department_id: uuid.UUID) -> None:
        ok = await self._departments.delete(department_id)
        if not ok:
            raise NotFound()

    async def create_employee(
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
        department_ids: list[uuid.UUID],
    ):
        return await self._employees.create(
            user_id=user_id,
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            middle_name=middle_name.strip() if middle_name is not None else None,
            work_email=work_email.lower().strip() if work_email is not None else None,
            phone=phone.strip() if phone is not None else None,
            position=position.strip() if position is not None else None,
            hire_date=hire_date,
            department_ids=department_ids,
        )

    async def list_employees(
        self,
        *,
        search: str | None,
        department_id: uuid.UUID | None,
        limit: int,
        offset: int,
    ):
        return await self._employees.list(
            search=search,
            department_id=department_id,
            limit=limit,
            offset=offset,
        )

    async def get_employee(self, employee_id: uuid.UUID):
        emp = await self._employees.get(employee_id)
        if emp is None:
            raise NotFound()
        return emp

    async def get_my_employee(self, user_id: uuid.UUID):
        emp = await self._employees.get_by_user_id(user_id)
        if emp is None:
            raise NotFound()
        return emp

    async def ensure_my_employee(self, *, user_id: uuid.UUID, email: str | None):
        emp = await self._employees.get_by_user_id(user_id)
        if emp is not None:
            return emp

        email_norm = email.lower().strip() if email else None
        if email_norm:
            by_email = await self._employees.get_by_work_email(email_norm)
            if by_email is not None:
                if by_email.user_id is None:
                    updated = await self._employees.update(
                        by_email.id,
                        user_id=user_id,
                        first_name=None,
                        last_name=None,
                        middle_name=UNSET,
                        work_email=UNSET,
                        phone=UNSET,
                        position=UNSET,
                        hire_date=UNSET,
                        is_active=None,
                        department_ids=None,
                    )
                    if updated is not None:
                        return updated
                return by_email

        first_name, last_name = _derive_names_from_email(email_norm or "")
        return await self._employees.create(
            user_id=user_id,
            first_name=first_name,
            last_name=last_name,
            middle_name=None,
            work_email=email_norm,
            phone=None,
            position=None,
            hire_date=None,
            department_ids=[],
        )

    async def update_employee(
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
        department_ids: list[uuid.UUID] | None,
    ):
        if middle_name is not UNSET and middle_name is not None:
            middle_name = middle_name.strip()
        if work_email is not UNSET and work_email is not None:
            work_email = work_email.lower().strip()
        if phone is not UNSET and phone is not None:
            phone = phone.strip()
        if position is not UNSET and position is not None:
            position = position.strip()

        emp = await self._employees.update(
            employee_id,
            user_id=user_id,
            first_name=first_name.strip() if first_name is not None else None,
            last_name=last_name.strip() if last_name is not None else None,
            middle_name=middle_name,
            work_email=work_email,
            phone=phone,
            position=position,
            hire_date=hire_date,
            is_active=is_active,
            department_ids=department_ids,
        )
        if emp is None:
            raise NotFound()
        return emp

    async def delete_employee(self, employee_id: uuid.UUID) -> None:
        ok = await self._employees.delete(employee_id)
        if not ok:
            raise NotFound()


def _derive_names_from_email(email: str) -> tuple[str, str]:
    local = (email.split("@")[0] if email else "").strip()
    if not local:
        return ("Employee", "User")
    parts = [p for p in local.replace("-", ".").replace("_", ".").split(".") if p]
    if len(parts) >= 2:
        return (_title(parts[0]), _title(parts[1]))
    return (_title(parts[0]), "User")


def _title(value: str) -> str:
    value = value.strip()
    if not value:
        return value
    return value[0].upper() + value[1:]
