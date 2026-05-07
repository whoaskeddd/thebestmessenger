from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from app.core.config import Settings, get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.domain.auth.exceptions import (
    BootstrapAdminConfigError,
    EmailAlreadyExists,
    ForbiddenUserCreation,
    InactiveUser,
    InvalidCurrentPassword,
    InvalidCredentials,
    InvalidRefreshToken,
    InvalidUserRole,
)
from app.domain.auth.repositories import RefreshSessionRepository, UserDTO, UserRepository


def _utcnow() -> datetime:
    return datetime.now(UTC)


class AuthService:
    def __init__(
        self,
        *,
        users: UserRepository,
        refresh_sessions: RefreshSessionRepository,
        settings: Settings | None = None,
    ) -> None:
        self._users = users
        self._refresh_sessions = refresh_sessions
        self._settings = settings or get_settings()

    async def register(self, *, email: str, password: str, role: str = "employee") -> dict[str, str]:
        existing = await self._users.get_by_email(email)
        if existing is not None:
            raise EmailAlreadyExists()

        user = await self._users.create_user(
            email=email,
            password_hash=hash_password(password),
            role=role,
            is_active=True,
        )

        access = create_access_token(
            user_id=user.id,
            email=user.email,
            role=user.role,
            token_version=user.token_version,
            settings=self._settings,
        )
        refresh_plain = create_refresh_token()
        refresh_hash = hash_refresh_token(refresh_plain)
        expires_at = _utcnow() + timedelta(days=self._settings.refresh_token_ttl_days)
        await self._refresh_sessions.create(user_id=user.id, token_hash=refresh_hash, expires_at=expires_at)

        return {"access_token": access, "refresh_token": refresh_plain}

    async def create_user_by_admin(
        self,
        *,
        actor_role: str,
        email: str,
        password: str,
        role: str,
    ) -> UserDTO:
        if actor_role != "admin":
            raise ForbiddenUserCreation()
        if role not in {"employee", "hr"}:
            raise InvalidUserRole()

        email_norm = email.lower().strip()
        existing = await self._users.get_by_email(email_norm)
        if existing is not None:
            raise EmailAlreadyExists()

        return await self._users.create_user(
            email=email_norm,
            password_hash=hash_password(password),
            role=role,
            is_active=True,
        )

    async def ensure_bootstrap_admin(self) -> bool:
        email = (self._settings.bootstrap_admin_email or "").strip().lower()
        password = (self._settings.bootstrap_admin_password or "").strip()

        if not email and not password:
            return False
        if not email or not password:
            raise BootstrapAdminConfigError()

        existing = await self._users.get_by_email(email)
        if existing is not None:
            if existing.role != "admin":
                raise BootstrapAdminConfigError()
            return False

        await self._users.create_user(
            email=email,
            password_hash=hash_password(password),
            role="admin",
            is_active=True,
        )
        return True

    async def login(self, *, email: str, password: str) -> dict[str, str]:
        user = await self._users.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise InvalidCredentials()
        if not user.is_active:
            raise InactiveUser()

        access = create_access_token(
            user_id=user.id,
            email=user.email,
            role=user.role,
            token_version=user.token_version,
            settings=self._settings,
        )

        refresh_plain = create_refresh_token()
        refresh_hash = hash_refresh_token(refresh_plain)
        expires_at = _utcnow() + timedelta(days=self._settings.refresh_token_ttl_days)
        await self._refresh_sessions.create(user_id=user.id, token_hash=refresh_hash, expires_at=expires_at)

        return {"access_token": access, "refresh_token": refresh_plain}

    async def refresh(self, *, refresh_token: str) -> dict[str, str]:
        token_hash = hash_refresh_token(refresh_token)
        session = await self._refresh_sessions.get_by_token_hash(token_hash)
        if session is None:
            raise InvalidRefreshToken()
        if session.revoked_at is not None or session.expires_at <= _utcnow():
            raise InvalidRefreshToken()

        user = await self._users.get_by_id(session.user_id)
        if user is None or not user.is_active:
            raise InvalidRefreshToken()

        # rotate
        await self._refresh_sessions.revoke(session.id, revoked_at=_utcnow())

        access = create_access_token(
            user_id=user.id,
            email=user.email,
            role=user.role,
            token_version=user.token_version,
            settings=self._settings,
        )
        refresh_plain = create_refresh_token()
        refresh_hash = hash_refresh_token(refresh_plain)
        expires_at = _utcnow() + timedelta(days=self._settings.refresh_token_ttl_days)
        await self._refresh_sessions.create(user_id=user.id, token_hash=refresh_hash, expires_at=expires_at)

        return {"access_token": access, "refresh_token": refresh_plain}

    async def logout(self, *, refresh_token: str) -> None:
        token_hash = hash_refresh_token(refresh_token)
        session = await self._refresh_sessions.get_by_token_hash(token_hash)
        if session is None:
            return
        await self._refresh_sessions.revoke(session.id, revoked_at=_utcnow())

    async def change_password(
        self, *, user_id: uuid.UUID, current_password: str, new_password: str
    ) -> None:
        user = await self._users.get_by_id(user_id)
        if user is None or not user.is_active:
            raise InvalidCredentials()
        if not verify_password(current_password, user.password_hash):
            raise InvalidCurrentPassword()

        await self._users.update_password_hash(
            user_id,
            password_hash=hash_password(new_password),
        )
