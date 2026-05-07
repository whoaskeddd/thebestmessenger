from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import datetime
from typing import Protocol


class UserDTO(Protocol):
    id: uuid.UUID
    email: str
    password_hash: str
    role: str
    is_active: bool
    token_version: int


class RefreshSessionDTO(Protocol):
    id: uuid.UUID
    user_id: uuid.UUID
    token_hash: str
    expires_at: datetime
    revoked_at: datetime | None


class UserRepository(Protocol):
    async def get_by_email(self, email: str) -> UserDTO | None: ...

    async def get_by_id(self, user_id: uuid.UUID) -> UserDTO | None: ...

    async def create_user(
        self,
        *,
        email: str,
        password_hash: str,
        role: str,
        is_active: bool,
    ) -> UserDTO: ...

    async def update_password_hash(self, user_id: uuid.UUID, *, password_hash: str) -> bool: ...


class RefreshSessionRepository(Protocol):
    async def create(
        self,
        *,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshSessionDTO: ...

    async def get_by_token_hash(self, token_hash: str) -> RefreshSessionDTO | None: ...

    async def revoke(self, session_id: uuid.UUID, *, revoked_at: datetime) -> None: ...
