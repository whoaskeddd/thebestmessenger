import uuid
from dataclasses import dataclass

import pytest

from app.domain.announcements.exceptions import Forbidden, NotFound
from app.domain.announcements.use_cases import AnnouncementsService


@dataclass
class Announcement:
    id: uuid.UUID
    created_by_user_id: uuid.UUID
    title: str
    body: str
    is_global: bool


class FakeAnnouncementsRepo:
    def __init__(self) -> None:
        self._items: dict[uuid.UUID, Announcement] = {}
        self.read_marks: set[tuple[uuid.UUID, uuid.UUID]] = set()

    async def create(self, *, created_by_user_id, title, body, is_global, department_ids):
        ann = Announcement(
            id=uuid.uuid4(),
            created_by_user_id=created_by_user_id,
            title=title,
            body=body,
            is_global=is_global,
        )
        self._items[ann.id] = ann
        return ann

    async def get_for_user(self, announcement_id, *, actor_user_id, actor_role):
        return self._items.get(announcement_id)

    async def list_for_user(self, *, actor_user_id, actor_role, limit, offset):
        return list(self._items.values())[offset : offset + limit]

    async def mark_read(self, announcement_id, *, user_id):
        self.read_marks.add((announcement_id, user_id))

    async def is_read(self, announcement_id, *, user_id):
        return (announcement_id, user_id) in self.read_marks


@pytest.mark.asyncio
async def test_employee_cannot_create_announcement() -> None:
    repo = FakeAnnouncementsRepo()
    service = AnnouncementsService(announcements=repo)
    with pytest.raises(Forbidden):
        await service.create(
            actor_user_id=uuid.uuid4(),
            actor_role="employee",
            title="t",
            body="b",
            is_global=True,
            department_ids=[],
        )


@pytest.mark.asyncio
async def test_hr_can_create_and_mark_read() -> None:
    repo = FakeAnnouncementsRepo()
    service = AnnouncementsService(announcements=repo)
    hr_id = uuid.uuid4()
    ann = await service.create(
        actor_user_id=hr_id,
        actor_role="hr",
        title="  t  ",
        body="b",
        is_global=True,
        department_ids=[],
    )
    assert ann.title == "t"

    await service.mark_read(ann.id, actor_user_id=hr_id, actor_role="hr")
    assert (ann.id, hr_id) in repo.read_marks

