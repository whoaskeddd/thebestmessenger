from __future__ import annotations

import hashlib
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import Settings, get_settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def _utcnow() -> datetime:
    return datetime.now(UTC)


def create_access_token(
    *,
    user_id: uuid.UUID,
    email: str,
    role: str,
    token_version: int,
    settings: Settings | None = None,
) -> str:
    settings = settings or get_settings()
    expires = _utcnow() + timedelta(minutes=settings.access_token_ttl_minutes)
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "tv": token_version,
        "exp": expires,
        "iat": _utcnow(),
        "type": "access",
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


@dataclass(frozen=True)
class AccessTokenPayload:
    user_id: uuid.UUID
    email: str
    role: str
    token_version: int


def decode_access_token(token: str, *, settings: Settings | None = None) -> AccessTokenPayload:
    settings = settings or get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("invalid token") from exc

    if payload.get("type") != "access":
        raise ValueError("invalid token type")

    try:
        return AccessTokenPayload(
            user_id=uuid.UUID(str(payload["sub"])),
            email=str(payload["email"]),
            role=str(payload["role"]),
            token_version=int(payload["tv"]),
        )
    except (KeyError, ValueError, TypeError) as exc:
        raise ValueError("invalid token payload") from exc


def create_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(refresh_token: str) -> str:
    return hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()

