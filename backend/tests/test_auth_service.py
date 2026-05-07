import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import pytest

from app.core.config import Settings
from app.core.security import decode_access_token
from app.domain.auth.exceptions import (
    BootstrapAdminConfigError,
    EmailAlreadyExists,
    ForbiddenUserCreation,
    InvalidCredentials,
    InvalidCurrentPassword,
    InvalidRefreshToken,
)
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

    async def update_password_hash(self, user_id: uuid.UUID, *, password_hash: str) -> bool:
        user = self._by_id.get(user_id)
        if user is None:
            return False
        user.password_hash = password_hash
        user.token_version += 1
        return True


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

    tokens = await service.register(email="a@b.com", password="Password123")
    payload = decode_access_token(tokens["access_token"], settings=settings)
    assert payload.email == "a@b.com"

    tokens2 = await service.login(email="a@b.com", password="Password123")
    assert "access_token" in tokens2 and "refresh_token" in tokens2

    tokens3 = await service.refresh(refresh_token=tokens2["refresh_token"])
    assert "access_token" in tokens3 and "refresh_token" in tokens3


@pytest.mark.asyncio
async def test_register_duplicate_email() -> None:
    users = FakeUsersRepo()
    refresh = FakeRefreshRepo()
    settings = Settings(JWT_SECRET_KEY="test", JWT_ALGORITHM="HS256")
    service = AuthService(users=users, refresh_sessions=refresh, settings=settings)

    await service.register(email="a@b.com", password="Password123")
    with pytest.raises(EmailAlreadyExists):
        await service.register(email="a@b.com", password="Password123")


@pytest.mark.asyncio
async def test_login_invalid_credentials() -> None:
    users = FakeUsersRepo()
    refresh = FakeRefreshRepo()
    settings = Settings(JWT_SECRET_KEY="test", JWT_ALGORITHM="HS256")
    service = AuthService(users=users, refresh_sessions=refresh, settings=settings)

    await service.register(email="a@b.com", password="Password123")
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


@pytest.mark.asyncio
async def test_change_password_success() -> None:
    users = FakeUsersRepo()
    refresh = FakeRefreshRepo()
    settings = Settings(JWT_SECRET_KEY="test", JWT_ALGORITHM="HS256")
    service = AuthService(users=users, refresh_sessions=refresh, settings=settings)

    await service.register(email="a@b.com", password="Password123")
    user = await users.get_by_email("a@b.com")
    assert user is not None

    await service.change_password(
        user_id=user.id,
        current_password="Password123",
        new_password="new-password-123",
    )

    with pytest.raises(InvalidCredentials):
        await service.login(email="a@b.com", password="Password123")

    tokens = await service.login(email="a@b.com", password="new-password-123")
    assert "access_token" in tokens


@pytest.mark.asyncio
async def test_change_password_invalid_current_password() -> None:
    users = FakeUsersRepo()
    refresh = FakeRefreshRepo()
    settings = Settings(JWT_SECRET_KEY="test", JWT_ALGORITHM="HS256")
    service = AuthService(users=users, refresh_sessions=refresh, settings=settings)

    await service.register(email="a@b.com", password="Password123")
    user = await users.get_by_email("a@b.com")
    assert user is not None

    with pytest.raises(InvalidCurrentPassword):
        await service.change_password(
            user_id=user.id,
            current_password="wrong-password",
            new_password="new-password-123",
        )


@pytest.mark.asyncio
async def test_admin_can_create_hr_user() -> None:
    users = FakeUsersRepo()
    refresh = FakeRefreshRepo()
    settings = Settings(JWT_SECRET_KEY="test", JWT_ALGORITHM="HS256")
    service = AuthService(users=users, refresh_sessions=refresh, settings=settings)

    created = await service.create_user_by_admin(
        actor_role="admin",
        email="hr@example.com",
        password="Password123",
        role="hr",
    )

    assert created.email == "hr@example.com"
    assert created.role == "hr"


@pytest.mark.asyncio
async def test_non_admin_cannot_create_users() -> None:
    users = FakeUsersRepo()
    refresh = FakeRefreshRepo()
    settings = Settings(JWT_SECRET_KEY="test", JWT_ALGORITHM="HS256")
    service = AuthService(users=users, refresh_sessions=refresh, settings=settings)

    with pytest.raises(ForbiddenUserCreation):
        await service.create_user_by_admin(
            actor_role="employee",
            email="hr@example.com",
            password="Password123",
            role="hr",
        )


@pytest.mark.asyncio
async def test_bootstrap_admin_created_from_settings() -> None:
    users = FakeUsersRepo()
    refresh = FakeRefreshRepo()
    settings = Settings(
        JWT_SECRET_KEY="test",
        JWT_ALGORITHM="HS256",
        BOOTSTRAP_ADMIN_EMAIL="admin@example.com",
        BOOTSTRAP_ADMIN_PASSWORD="Password123",
    )
    service = AuthService(users=users, refresh_sessions=refresh, settings=settings)

    created = await service.ensure_bootstrap_admin()
    assert created is True

    admin = await users.get_by_email("admin@example.com")
    assert admin is not None
    assert admin.role == "admin"


@pytest.mark.asyncio
async def test_bootstrap_admin_requires_both_email_and_password() -> None:
    users = FakeUsersRepo()
    refresh = FakeRefreshRepo()
    settings = Settings(
        JWT_SECRET_KEY="test",
        JWT_ALGORITHM="HS256",
        BOOTSTRAP_ADMIN_EMAIL="admin@example.com",
    )
    service = AuthService(users=users, refresh_sessions=refresh, settings=settings)

    with pytest.raises(BootstrapAdminConfigError):
        await service.ensure_bootstrap_admin()
