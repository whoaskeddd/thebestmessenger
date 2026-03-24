from __future__ import annotations

import uuid
from collections.abc import Sequence

from sqlalchemy import delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.employees.repositories import DepartmentsRepository, EmployeesRepository
from app.domain.employees.repositories import UNSET
from app.infrastructure.employees.models import Department, Employee


class SQLAlchemyDepartmentsRepository(DepartmentsRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, *, name: str) -> Department:
        dep = Department(name=name)
        self._session.add(dep)
        await self._session.flush()
        return dep

    async def get(self, department_id: uuid.UUID) -> Department | None:
        result = await self._session.execute(select(Department).where(Department.id == department_id))
        return result.scalar_one_or_none()

    async def list(self, *, search: str | None, limit: int, offset: int) -> Sequence[Department]:
        stmt = select(Department).order_by(Department.name).limit(limit).offset(offset)
        if search:
            stmt = stmt.where(Department.name.ilike(f"%{search}%"))
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, department_id: uuid.UUID, *, name: str | None) -> Department | None:
        dep = await self.get(department_id)
        if dep is None:
            return None
        if name is not None:
            dep.name = name
        await self._session.flush()
        return dep

    async def delete(self, department_id: uuid.UUID) -> bool:
        result = await self._session.execute(delete(Department).where(Department.id == department_id))
        return result.rowcount > 0


class SQLAlchemyEmployeesRepository(EmployeesRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

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
        department_ids: Sequence[uuid.UUID],
    ) -> Employee:
        departments: list[Department] = []
        if department_ids:
            result = await self._session.execute(select(Department).where(Department.id.in_(department_ids)))
            departments = list(result.scalars().all())

        emp = Employee(
            user_id=user_id,
            first_name=first_name,
            last_name=last_name,
            middle_name=middle_name,
            work_email=work_email,
            phone=phone,
            position=position,
            departments=departments,
        )
        self._session.add(emp)
        await self._session.flush()
        return emp

    async def get(self, employee_id: uuid.UUID) -> Employee | None:
        stmt = (
            select(Employee)
            .where(Employee.id == employee_id)
            .options(selectinload(Employee.departments))
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        search: str | None,
        department_id: uuid.UUID | None,
        limit: int,
        offset: int,
    ) -> Sequence[Employee]:
        stmt = select(Employee).options(selectinload(Employee.departments)).order_by(
            Employee.last_name, Employee.first_name
        )

        if search:
            like = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Employee.first_name.ilike(like),
                    Employee.last_name.ilike(like),
                    Employee.middle_name.ilike(like),
                    Employee.work_email.ilike(like),
                )
            )

        if department_id is not None:
            stmt = stmt.where(Employee.departments.any(Department.id == department_id))

        stmt = stmt.limit(limit).offset(offset)
        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

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
        is_active: bool | None,
        department_ids: Sequence[uuid.UUID] | None,
    ) -> Employee | None:
        emp = await self.get(employee_id)
        if emp is None:
            return None

        if user_id is not UNSET:
            emp.user_id = user_id  # type: ignore[assignment]
        if first_name is not None:
            emp.first_name = first_name
        if last_name is not None:
            emp.last_name = last_name
        if middle_name is not UNSET:
            emp.middle_name = middle_name  # type: ignore[assignment]
        if work_email is not UNSET:
            emp.work_email = work_email  # type: ignore[assignment]
        if phone is not UNSET:
            emp.phone = phone  # type: ignore[assignment]
        if position is not UNSET:
            emp.position = position  # type: ignore[assignment]
        if is_active is not None:
            emp.is_active = is_active

        if department_ids is not None:
            if department_ids:
                result = await self._session.execute(select(Department).where(Department.id.in_(department_ids)))
                emp.departments = list(result.scalars().all())
            else:
                emp.departments = []

        await self._session.flush()
        return emp

    async def delete(self, employee_id: uuid.UUID) -> bool:
        result = await self._session.execute(delete(Employee).where(Employee.id == employee_id))
        return result.rowcount > 0

