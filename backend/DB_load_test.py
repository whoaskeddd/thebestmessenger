from __future__ import annotations

import argparse
import asyncio
import random
from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import create_engine, create_sessionmaker, dispose_engine
from app.infrastructure.db import models as _db_models  # noqa: F401
from app.infrastructure.employees.models import Department, Employee
from app.infrastructure.employees.repositories import (
    SQLAlchemyDepartmentsRepository,
    SQLAlchemyEmployeesRepository,
)

FIRST_NAMES = (
    "Ivan",
    "Petr",
    "Sergey",
    "Alexey",
    "Dmitry",
    "Andrey",
    "Nikolay",
    "Mikhail",
    "Elena",
    "Anna",
    "Olga",
    "Natalia",
    "Irina",
    "Maria",
    "Ekaterina",
    "Svetlana",
)

LAST_NAMES = (
    "Ivanov",
    "Petrov",
    "Sidorov",
    "Smirnov",
    "Kuznetsov",
    "Popov",
    "Sokolov",
    "Lebedev",
    "Morozov",
    "Volkov",
    "Fedorov",
    "Solovyov",
)

MIDDLE_NAMES = (
    "Ivanovich",
    "Petrovich",
    "Sergeevich",
    "Andreevich",
    "Dmitrievich",
    "Nikolaevich",
    "Ivanovna",
    "Petrovna",
    "Sergeevna",
    "Andreevna",
    "Dmitrievna",
    "Nikolaevna",
)

POSITIONS = (
    "HR Manager",
    "Recruiter",
    "Backend Developer",
    "Frontend Developer",
    "QA Engineer",
    "DevOps Engineer",
    "Business Analyst",
    "Project Manager",
    "Accountant",
    "Office Manager",
)

DEPARTMENT_NAMES = (
    "HR",
    "IT",
    "Finance",
    "Operations",
    "Marketing",
    "Sales",
    "Support",
    "Legal",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Populate the database with random employee test data.",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=100,
        help="Number of employees to create. Default: 100.",
    )
    return parser.parse_args()


def build_phone() -> str:
    return f"+79{random.randint(10, 99)}{random.randint(1000000, 9999999)}"


def build_email(first_name: str, last_name: str, index: int) -> str:
    return f"{first_name.lower()}.{last_name.lower()}{index}@example.com"


async def get_or_create_departments(
    session: AsyncSession,
    repository: SQLAlchemyDepartmentsRepository,
) -> list[Department]:
    result = await session.execute(select(Department).order_by(Department.name))
    departments = list(result.scalars().all())
    if departments:
        return departments

    created: list[Department] = []
    for name in DEPARTMENT_NAMES:
        created.append(await repository.create(name=name))
    return created


def pick_department_ids(departments: Sequence[Department]) -> list[UUID]:
    amount = random.randint(1, min(3, len(departments)))
    return [department.id for department in random.sample(list(departments), k=amount)]


async def populate_employees(count: int) -> None:
    if count <= 0:
        raise ValueError("count must be greater than 0")

    engine = create_engine()
    sessionmaker = create_sessionmaker(engine)

    try:
        async with sessionmaker() as session:
            existing_employees = await session.scalar(select(func.count()).select_from(Employee))
            if (existing_employees or 0) > 0:
                print(
                    "Skipping test data load: employees table already contains "
                    f"{existing_employees} records.",
                )
                return

            departments_repo = SQLAlchemyDepartmentsRepository(session)
            employees_repo = SQLAlchemyEmployeesRepository(session)
            departments = await get_or_create_departments(session, departments_repo)

            for index in range(1, count + 1):
                first_name = random.choice(FIRST_NAMES)
                last_name = random.choice(LAST_NAMES)
                middle_name = random.choice(MIDDLE_NAMES) if random.random() < 0.85 else None
                position = random.choice(POSITIONS)
                phone = build_phone() if random.random() < 0.9 else None
                is_active = random.random() < 0.95

                employee = await employees_repo.create(
                    user_id=None,
                    first_name=first_name,
                    last_name=last_name,
                    middle_name=middle_name,
                    work_email=build_email(first_name, last_name, index),
                    phone=phone,
                    position=position,
                    department_ids=pick_department_ids(departments),
                )
                employee.is_active = is_active

            await session.commit()

            total_employees = await session.scalar(select(func.count()).select_from(Employee))
            print(f"Inserted {count} employees. Total employees in DB: {total_employees}")
    finally:
        await dispose_engine()


async def main() -> None:
    args = parse_args()
    await populate_employees(args.count)


if __name__ == "__main__":
    asyncio.run(main())
