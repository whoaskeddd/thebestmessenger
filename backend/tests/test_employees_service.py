import uuid
from dataclasses import dataclass

import pytest

from app.domain.employees.repositories import UNSET
from app.domain.employees.use_cases import EmployeesService


@dataclass
class Department:
    id: uuid.UUID
    name: str


@dataclass
class Employee:
    id: uuid.UUID
    user_id: uuid.UUID | None
    first_name: str
    last_name: str
    middle_name: str | None
    work_email: str | None
    phone: str | None
    position: str | None
    is_active: bool
    departments: list[Department]


class FakeDepartmentsRepo:
    def __init__(self) -> None:
        self._deps: dict[uuid.UUID, Department] = {}

    async def create(self, *, name: str) -> Department:
        dep = Department(id=uuid.uuid4(), name=name)
        self._deps[dep.id] = dep
        return dep

    async def get(self, department_id: uuid.UUID) -> Department | None:
        return self._deps.get(department_id)

    async def list(self, *, search: str | None, limit: int, offset: int):
        items = list(self._deps.values())
        if search:
            items = [d for d in items if search.lower() in d.name.lower()]
        return items[offset : offset + limit]

    async def update(self, department_id: uuid.UUID, *, name: str | None) -> Department | None:
        dep = self._deps.get(department_id)
        if dep is None:
            return None
        if name is not None:
            dep.name = name
        return dep

    async def delete(self, department_id: uuid.UUID) -> bool:
        return self._deps.pop(department_id, None) is not None


class FakeEmployeesRepo:
    def __init__(self, deps: FakeDepartmentsRepo) -> None:
        self._emps: dict[uuid.UUID, Employee] = {}
        self._deps = deps

    async def create(
        self,
        *,
        user_id,
        first_name,
        last_name,
        middle_name,
        work_email,
        phone,
        position,
        department_ids,
    ) -> Employee:
        departments = [self._deps._deps[d] for d in department_ids if d in self._deps._deps]
        emp = Employee(
            id=uuid.uuid4(),
            user_id=user_id,
            first_name=first_name,
            last_name=last_name,
            middle_name=middle_name,
            work_email=work_email,
            phone=phone,
            position=position,
            is_active=True,
            departments=departments,
        )
        self._emps[emp.id] = emp
        return emp

    async def get(self, employee_id: uuid.UUID) -> Employee | None:
        return self._emps.get(employee_id)

    async def list(self, *, search: str | None, department_id, limit: int, offset: int):
        items = list(self._emps.values())
        if search:
            s = search.lower()
            items = [
                e
                for e in items
                if s in e.first_name.lower()
                or s in e.last_name.lower()
                or (e.middle_name or "").lower().find(s) >= 0
                or (e.work_email or "").lower().find(s) >= 0
            ]
        if department_id is not None:
            items = [e for e in items if any(d.id == department_id for d in e.departments)]
        return items[offset : offset + limit]

    async def update(
        self,
        employee_id: uuid.UUID,
        *,
        user_id,
        first_name,
        last_name,
        middle_name,
        work_email,
        phone,
        position,
        is_active,
        department_ids,
    ) -> Employee | None:
        emp = self._emps.get(employee_id)
        if emp is None:
            return None
        if user_id is not UNSET:
            emp.user_id = user_id
        if first_name is not None:
            emp.first_name = first_name
        if last_name is not None:
            emp.last_name = last_name
        if middle_name is not UNSET:
            emp.middle_name = middle_name
        if work_email is not UNSET:
            emp.work_email = work_email
        if phone is not UNSET:
            emp.phone = phone
        if position is not UNSET:
            emp.position = position
        if is_active is not None:
            emp.is_active = is_active
        if department_ids is not None:
            emp.departments = [self._deps._deps[d] for d in department_ids if d in self._deps._deps]
        return emp

    async def delete(self, employee_id: uuid.UUID) -> bool:
        return self._emps.pop(employee_id, None) is not None


@pytest.mark.asyncio
async def test_create_employee_normalizes_fields_and_update_unset() -> None:
    deps_repo = FakeDepartmentsRepo()
    employees_repo = FakeEmployeesRepo(deps_repo)
    service = EmployeesService(employees=employees_repo, departments=deps_repo)

    dep = await service.create_department(name="  HR  ")
    emp = await service.create_employee(
        user_id=None,
        first_name="  Ivan ",
        last_name=" Petrov ",
        middle_name=None,
        work_email="IVAN@EXAMPLE.COM",
        phone="  +7999 ",
        position=" Dev ",
        department_ids=[dep.id],
    )
    assert emp.first_name == "Ivan"
    assert emp.last_name == "Petrov"
    assert emp.work_email == "ivan@example.com"
    assert emp.phone == "+7999"
    assert emp.position == "Dev"

    updated = await service.update_employee(
        emp.id,
        user_id=UNSET,
        first_name=None,
        last_name=None,
        middle_name=UNSET,
        work_email=UNSET,
        phone=UNSET,
        position=UNSET,
        is_active=None,
        department_ids=None,
    )
    assert updated.id == emp.id


@pytest.mark.asyncio
async def test_list_employees_filter_by_department() -> None:
    deps_repo = FakeDepartmentsRepo()
    employees_repo = FakeEmployeesRepo(deps_repo)
    service = EmployeesService(employees=employees_repo, departments=deps_repo)

    dep_hr = await service.create_department(name="HR")
    dep_it = await service.create_department(name="IT")

    await service.create_employee(
        user_id=None,
        first_name="Ivan",
        last_name="Petrov",
        middle_name=None,
        work_email="ivan@example.com",
        phone=None,
        position=None,
        department_ids=[dep_hr.id],
    )
    await service.create_employee(
        user_id=None,
        first_name="Petr",
        last_name="Ivanov",
        middle_name=None,
        work_email="petr@example.com",
        phone=None,
        position=None,
        department_ids=[dep_it.id],
    )

    only_hr = await service.list_employees(search=None, department_id=dep_hr.id, limit=50, offset=0)
    assert len(only_hr) == 1
    assert only_hr[0].work_email == "ivan@example.com"

