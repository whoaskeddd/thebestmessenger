from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.auth.repositories import RefreshSessionRepository, UserRepository
from app.infrastructure.auth.models import RefreshSession
from app.infrastructure.users.models import User


class SQLAlchemyUserRepository(UserRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_email(self, email: str) -> User | None:
        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self._session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def create_user(
        self,
        *,
        email: str,
        password_hash: str,
        role: str,
        is_active: bool,
    ) -> User:
        user = User(email=email, password_hash=password_hash, role=role, is_active=is_active)
        self._session.add(user)
        await self._session.flush()
        return user


class SQLAlchemyRefreshSessionRepository(RefreshSessionRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshSession:
        session = RefreshSession(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self._session.add(session)
        await self._session.flush()
        return session

    async def get_by_token_hash(self, token_hash: str) -> RefreshSession | None:
        result = await self._session.execute(
            select(RefreshSession).where(RefreshSession.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def revoke(self, session_id: uuid.UUID, *, revoked_at: datetime) -> None:
        await self._session.execute(
            update(RefreshSession)
            .where(RefreshSession.id == session_id)
            .values(revoked_at=revoked_at)
        )

