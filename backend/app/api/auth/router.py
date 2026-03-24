from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DbSessionDep
from app.api.auth.security import get_current_user
from app.domain.auth.exceptions import (
    EmailAlreadyExists,
    InactiveUser,
    InvalidCredentials,
    InvalidRefreshToken,
)
from app.domain.auth.use_cases import AuthService
from app.infrastructure.auth.repositories import (
    SQLAlchemyRefreshSessionRepository,
    SQLAlchemyUserRepository,
)
from app.schemas.auth import (
    LoginRequest,
    MeResponse,
    RefreshRequest,
    RegisterRequest,
    TokenPairResponse,
)


router = APIRouter(prefix="/auth", tags=["auth"])


def _service(session: AsyncSession) -> AuthService:
    return AuthService(
        users=SQLAlchemyUserRepository(session),
        refresh_sessions=SQLAlchemyRefreshSessionRepository(session),
    )


@router.post("/register", response_model=TokenPairResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, session: DbSessionDep) -> TokenPairResponse:
    service = _service(session)
    try:
        tokens = await service.register(email=str(payload.email), password=payload.password)
        await session.commit()
        return TokenPairResponse(**tokens)
    except EmailAlreadyExists as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="email already exists") from exc


@router.post("/login", response_model=TokenPairResponse)
async def login(payload: LoginRequest, session: DbSessionDep) -> TokenPairResponse:
    service = _service(session)
    try:
        tokens = await service.login(email=str(payload.email), password=payload.password)
        await session.commit()
        return TokenPairResponse(**tokens)
    except (InvalidCredentials, InactiveUser) as exc:
        await session.rollback()
        raise HTTPException(status_code=401, detail="invalid credentials") from exc


@router.post("/refresh", response_model=TokenPairResponse)
async def refresh(payload: RefreshRequest, session: DbSessionDep) -> TokenPairResponse:
    service = _service(session)
    try:
        tokens = await service.refresh(refresh_token=payload.refresh_token)
        await session.commit()
        return TokenPairResponse(**tokens)
    except InvalidRefreshToken as exc:
        await session.rollback()
        raise HTTPException(status_code=401, detail="invalid refresh token") from exc


@router.get("/me", response_model=MeResponse)
async def me(user=Depends(get_current_user)) -> MeResponse:
    return MeResponse(id=str(user.id), email=user.email, role=user.role)

