from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError

from app.api.auth.security import get_current_user, require_role
from app.api.deps import DbSessionDep
from app.domain.employees.exceptions import NotFound
from app.domain.employees.repositories import UNSET
from app.domain.employees.use_cases import EmployeesService
from app.infrastructure.employees.repositories import (
    SQLAlchemyDepartmentsRepository,
    SQLAlchemyEmployeesRepository,
)
from app.schemas.employees import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
    EmployeeCreate,
    EmployeeResponse,
    EmployeeSelfUpdate,
    EmployeeUpdate,
)


router = APIRouter(tags=["employees"])


def _service(session: DbSessionDep) -> EmployeesService:
    return EmployeesService(
        employees=SQLAlchemyEmployeesRepository(session),
        departments=SQLAlchemyDepartmentsRepository(session),
    )


def _department_response(dep) -> DepartmentResponse:
    return DepartmentResponse(id=dep.id, name=dep.name)


def _employee_response(emp) -> EmployeeResponse:
    return EmployeeResponse(
        id=emp.id,
        user_id=emp.user_id,
        first_name=emp.first_name,
        last_name=emp.last_name,
        middle_name=emp.middle_name,
        work_email=emp.work_email,
        phone=emp.phone,
        position=emp.position,
        hire_date=emp.hire_date,
        is_active=emp.is_active,
        departments=[_department_response(d) for d in emp.departments],
    )


# Departments
@router.get("/departments", response_model=list[DepartmentResponse], dependencies=[Depends(get_current_user)])
async def list_departments(
    session: DbSessionDep,
    search: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[DepartmentResponse]:
    deps = await _service(session).list_departments(search=search, limit=limit, offset=offset)
    return [_department_response(d) for d in deps]


@router.post(
    "/departments",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def create_department(payload: DepartmentCreate, session: DbSessionDep) -> DepartmentResponse:
    try:
        dep = await _service(session).create_department(name=payload.name)
        await session.commit()
        return _department_response(dep)
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="department already exists") from exc


@router.get(
    "/departments/{department_id}",
    response_model=DepartmentResponse,
    dependencies=[Depends(get_current_user)],
)
async def get_department(department_id: uuid.UUID, session: DbSessionDep) -> DepartmentResponse:
    try:
        dep = await _service(session).get_department(department_id)
        return _department_response(dep)
    except NotFound as exc:
        raise HTTPException(status_code=404, detail="department not found") from exc


@router.patch(
    "/departments/{department_id}",
    response_model=DepartmentResponse,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def update_department(
    department_id: uuid.UUID, payload: DepartmentUpdate, session: DbSessionDep
) -> DepartmentResponse:
    try:
        dep = await _service(session).update_department(department_id, name=payload.name)
        await session.commit()
        return _department_response(dep)
    except NotFound as exc:
        await session.rollback()
        raise HTTPException(status_code=404, detail="department not found") from exc
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="department already exists") from exc


@router.delete(
    "/departments/{department_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def delete_department(department_id: uuid.UUID, session: DbSessionDep) -> None:
    try:
        await _service(session).delete_department(department_id)
        await session.commit()
    except NotFound as exc:
        await session.rollback()
        raise HTTPException(status_code=404, detail="department not found") from exc


# Employees
@router.get("/employees", response_model=list[EmployeeResponse], dependencies=[Depends(get_current_user)])
async def list_employees(
    session: DbSessionDep,
    search: str | None = None,
    department_id: uuid.UUID | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[EmployeeResponse]:
    emps = await _service(session).list_employees(
        search=search, department_id=department_id, limit=limit, offset=offset
    )
    return [_employee_response(e) for e in emps]


@router.post(
    "/employees",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def create_employee(payload: EmployeeCreate, session: DbSessionDep) -> EmployeeResponse:
    try:
        emp = await _service(session).create_employee(
            user_id=payload.user_id,
            first_name=payload.first_name,
            last_name=payload.last_name,
            middle_name=payload.middle_name,
            work_email=str(payload.work_email) if payload.work_email is not None else None,
            phone=payload.phone,
            position=payload.position,
            hire_date=payload.hire_date,
            department_ids=payload.department_ids,
        )
        await session.commit()
        return _employee_response(emp)
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="employee conflict") from exc


@router.get("/employees/me", response_model=EmployeeResponse)
async def get_my_employee(session: DbSessionDep, current_user=Depends(get_current_user)) -> EmployeeResponse:
    try:
        emp = await _service(session).get_my_employee(current_user.id)
        return _employee_response(emp)
    except NotFound as exc:
        raise HTTPException(status_code=404, detail="employee profile not found") from exc


@router.patch("/employees/me", response_model=EmployeeResponse)
async def update_my_employee(
    payload: EmployeeSelfUpdate, session: DbSessionDep, current_user=Depends(get_current_user)
) -> EmployeeResponse:
    fields = payload.model_fields_set

    def _maybe(field: str, value):
        return value if field in fields else UNSET

    try:
        profile = await _service(session).get_my_employee(current_user.id)
        emp = await _service(session).update_employee(
            profile.id,
            user_id=UNSET,
            first_name=payload.first_name if "first_name" in fields else None,
            last_name=payload.last_name if "last_name" in fields else None,
            middle_name=_maybe("middle_name", payload.middle_name),
            work_email=UNSET,
            phone=_maybe("phone", payload.phone),
            position=_maybe("position", payload.position),
            hire_date=UNSET,
            is_active=None,
            department_ids=None,
        )
        await session.commit()
        return _employee_response(emp)
    except NotFound as exc:
        await session.rollback()
        raise HTTPException(status_code=404, detail="employee profile not found") from exc
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="employee conflict") from exc


@router.get("/employees/{employee_id}", response_model=EmployeeResponse, dependencies=[Depends(get_current_user)])
async def get_employee(employee_id: uuid.UUID, session: DbSessionDep) -> EmployeeResponse:
    try:
        emp = await _service(session).get_employee(employee_id)
        return _employee_response(emp)
    except NotFound as exc:
        raise HTTPException(status_code=404, detail="employee not found") from exc


@router.patch(
    "/employees/{employee_id}",
    response_model=EmployeeResponse,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def update_employee(employee_id: uuid.UUID, payload: EmployeeUpdate, session: DbSessionDep) -> EmployeeResponse:
    fields = payload.model_fields_set

    def _maybe(field: str, value):
        return value if field in fields else UNSET

    try:
        emp = await _service(session).update_employee(
            employee_id,
            user_id=_maybe("user_id", payload.user_id),
            first_name=payload.first_name if "first_name" in fields else None,
            last_name=payload.last_name if "last_name" in fields else None,
            middle_name=_maybe("middle_name", payload.middle_name),
            work_email=_maybe("work_email", str(payload.work_email) if payload.work_email is not None else None),
            phone=_maybe("phone", payload.phone),
            position=_maybe("position", payload.position),
            hire_date=_maybe("hire_date", payload.hire_date),
            is_active=payload.is_active if "is_active" in fields else None,
            department_ids=payload.department_ids if "department_ids" in fields else None,
        )
        await session.commit()
        return _employee_response(emp)
    except NotFound as exc:
        await session.rollback()
        raise HTTPException(status_code=404, detail="employee not found") from exc
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="employee conflict") from exc


@router.delete(
    "/employees/{employee_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def delete_employee(employee_id: uuid.UUID, session: DbSessionDep) -> None:
    try:
        await _service(session).delete_employee(employee_id)
        await session.commit()
    except NotFound as exc:
        await session.rollback()
        raise HTTPException(status_code=404, detail="employee not found") from exc
