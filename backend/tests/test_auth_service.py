import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import pytest

from app.core.config import Settings
from app.core.security import decode_access_token
from app.domain.auth.exceptions import EmailAlreadyExists, InvalidCredentials, InvalidRefreshToken
from app.domain.auth.use_cases import AuthService


@dataclass
class User:
    id: uuid.UUID
    email: str
    password_hash: str
    role: str
    is_active: bool
    token_version: int


@dataclass
class RefreshSession:
    id: uuid.UUID
    user_id: uuid.UUID
    token_hash: str
    expires_at: datetime
    revoked_at: datetime | None


class FakeUsersRepo:
    def __init__(self) -> None:
        self._by_email: dict[str, User] = {}
        self._by_id: dict[uuid.UUID, User] = {}

    async def get_by_email(self, email: str) -> User | None:
        return self._by_email.get(email)

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return self._by_id.get(user_id)

    async def create_user(self, *, email: str, password_hash: str, role: str, is_active: bool) -> User:
        user = User(
            id=uuid.uuid4(),
            email=email,
            password_hash=password_hash,
            role=role,
            is_active=is_active,
            token_version=0,
        )
        self._by_email[email] = user
        self._by_id[user.id] = user
        return user


class FakeRefreshRepo:
    def __init__(self) -> None:
        self._by_hash: dict[str, RefreshSession] = {}

    async def create(self, *, user_id: uuid.UUID, token_hash: str, expires_at: datetime) -> RefreshSession:
        session = RefreshSession(
            id=uuid.uuid4(),
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            revoked_at=None,
        )
        self._by_hash[token_hash] = session
        return session

    async def get_by_token_hash(self, token_hash: str) -> RefreshSession | None:
        return self._by_hash.get(token_hash)

    async def revoke(self, session_id: uuid.UUID, *, revoked_at: datetime) -> None:
        for session in self._by_hash.values():
            if session.id == session_id:
                session.revoked_at = revoked_at
                break


@pytest.mark.asyncio
async def test_register_and_login_and_refresh() -> None:
    users = FakeUsersRepo()
    refresh = FakeRefreshRepo()
    settings = Settings(
        JWT_SECRET_KEY="test",
        JWT_ALGORITHM="HS256",
        ACCESS_TOKEN_TTL_MINUTES=15,
        REFRESH_TOKEN_TTL_DAYS=30,
    )
    service = AuthService(users=users, refresh_sessions=refresh, settings=settings)

    tokens = await service.register(email="a@b.com", password="password123")
    payload = decode_access_token(tokens["access_token"], settings=settings)
    assert payload.email == "a@b.com"

    tokens2 = await service.login(email="a@b.com", password="password123")
    assert "access_token" in tokens2 and "refresh_token" in tokens2

    tokens3 = await service.refresh(refresh_token=tokens2["refresh_token"])
    assert "access_token" in tokens3 and "refresh_token" in tokens3


@pytest.mark.asyncio
async def test_register_duplicate_email() -> None:
    users = FakeUsersRepo()
    refresh = FakeRefreshRepo()
    settings = Settings(JWT_SECRET_KEY="test", JWT_ALGORITHM="HS256")
    service = AuthService(users=users, refresh_sessions=refresh, settings=settings)

    await service.register(email="a@b.com", password="password123")
    with pytest.raises(EmailAlreadyExists):
        await service.register(email="a@b.com", password="password123")


@pytest.mark.asyncio
async def test_login_invalid_credentials() -> None:
    users = FakeUsersRepo()
    refresh = FakeRefreshRepo()
    settings = Settings(JWT_SECRET_KEY="test", JWT_ALGORITHM="HS256")
    service = AuthService(users=users, refresh_sessions=refresh, settings=settings)

    await service.register(email="a@b.com", password="password123")
    with pytest.raises(InvalidCredentials):
        await service.login(email="a@b.com", password="wrong")


@pytest.mark.asyncio
async def test_refresh_invalid_token() -> None:
    users = FakeUsersRepo()
    refresh = FakeRefreshRepo()
    settings = Settings(JWT_SECRET_KEY="test", JWT_ALGORITHM="HS256")
    service = AuthService(users=users, refresh_sessions=refresh, settings=settings)

    with pytest.raises(InvalidRefreshToken):
        await service.refresh(refresh_token="nope")
