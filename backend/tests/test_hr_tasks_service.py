import uuid
from dataclasses import dataclass
from datetime import date

import pytest

from app.domain.hr_tasks.exceptions import Forbidden, NotFound
from app.domain.hr_tasks.use_cases import HrTasksService


@dataclass
class Task:
    id: uuid.UUID
    created_by_user_id: uuid.UUID
    announcement_id: uuid.UUID | None
    title: str
    description: str | None
    due_date: date | None


class FakeTasksRepo:
    def __init__(self) -> None:
        self.items: dict[uuid.UUID, Task] = {}

    async def create(self, *, created_by_user_id, announcement_id, title, description, due_date):
        task = Task(
            id=uuid.uuid4(),
            created_by_user_id=created_by_user_id,
            announcement_id=announcement_id,
            title=title,
            description=description,
            due_date=due_date,
        )
        self.items[task.id] = task
        return task

    async def get(self, task_id):
        return self.items.get(task_id)

    async def list_all(self, *, limit, offset):
        return list(self.items.values())[offset : offset + limit]


class FakeAssignmentsRepo:
    def __init__(self) -> None:
        self.assigned: list[tuple[uuid.UUID, uuid.UUID]] = []
        self.completed: set[tuple[uuid.UUID, uuid.UUID]] = set()

    async def assign(self, *, task_id, user_ids):
        for uid in user_ids:
            self.assigned.append((task_id, uid))

    async def list_for_user(self, *, user_id, include_completed, limit, offset):
        return []

    async def complete(self, *, task_id, user_id):
        if (task_id, user_id) not in self.assigned:
            return False
        self.completed.add((task_id, user_id))
        return True


@pytest.mark.asyncio
async def test_employee_cannot_create_or_list_all() -> None:
    service = HrTasksService(tasks=FakeTasksRepo(), assignments=FakeAssignmentsRepo())
    with pytest.raises(Forbidden):
        await service.create(
            actor_user_id=uuid.uuid4(),
            actor_role="employee",
            title="t",
            description=None,
            due_date=None,
            announcement_id=None,
            assignee_user_ids=[],
        )
    with pytest.raises(Forbidden):
        await service.list_all(actor_role="employee", limit=50, offset=0)


@pytest.mark.asyncio
async def test_hr_create_assign_and_complete() -> None:
    tasks = FakeTasksRepo()
    assignments = FakeAssignmentsRepo()
    service = HrTasksService(tasks=tasks, assignments=assignments)

    hr_id = uuid.uuid4()
    user_id = uuid.uuid4()
    task = await service.create(
        actor_user_id=hr_id,
        actor_role="hr",
        title="  title ",
        description="d",
        due_date=None,
        announcement_id=None,
        assignee_user_ids=[user_id],
    )
    assert task.title == "title"
    assert (task.id, user_id) in assignments.assigned

    await service.complete(task.id, actor_user_id=user_id)
    assert (task.id, user_id) in assignments.completed

    with pytest.raises(NotFound):
        await service.complete(uuid.uuid4(), actor_user_id=user_id)

