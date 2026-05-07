from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DbSessionDep
from app.api.auth.security import get_current_user, require_role
from app.domain.auth.exceptions import (
    EmailAlreadyExists,
    ForbiddenUserCreation,
    InactiveUser,
    InvalidCurrentPassword,
    InvalidCredentials,
    InvalidRefreshToken,
    InvalidUserRole,
)
from app.domain.auth.use_cases import AuthService
from app.infrastructure.auth.repositories import (
    SQLAlchemyRefreshSessionRepository,
    SQLAlchemyUserRepository,
)
from app.schemas.auth import (
    AdminCreateUserRequest,
    ChangePasswordRequest,
    LoginRequest,
    MeResponse,
    RefreshRequest,
    RegisterRequest,
    TokenPairResponse,
    UserResponse,
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
    except IntegrityError as exc:
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
        await asyncio.sleep(0.35)
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


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(payload: RefreshRequest, session: DbSessionDep) -> None:
    service = _service(session)
    await service.logout(refresh_token=payload.refresh_token)
    await session.commit()


@router.get("/me", response_model=MeResponse)
async def me(user=Depends(get_current_user)) -> MeResponse:
    return MeResponse(id=str(user.id), email=user.email, role=user.role)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: ChangePasswordRequest,
    session: DbSessionDep,
    user=Depends(get_current_user),
) -> None:
    service = _service(session)
    try:
        await service.change_password(
            user_id=user.id,
            current_password=payload.current_password,
            new_password=payload.new_password,
        )
        await session.commit()
    except InvalidCurrentPassword as exc:
        await session.rollback()
        raise HTTPException(status_code=401, detail="invalid current password") from exc


@router.post(
    "/admin/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("admin"))],
)
async def admin_create_user(
    payload: AdminCreateUserRequest,
    session: DbSessionDep,
    user=Depends(get_current_user),
) -> UserResponse:
    service = _service(session)
    try:
        created = await service.create_user_by_admin(
            actor_role=user.role,
            email=str(payload.email),
            password=payload.password,
            role=payload.role,
        )
        await session.commit()
        return UserResponse(
            id=created.id,
            email=created.email,
            role=created.role,
            is_active=created.is_active,
        )
    except ForbiddenUserCreation as exc:
        await session.rollback()
        raise HTTPException(status_code=403, detail="forbidden") from exc
    except InvalidUserRole as exc:
        await session.rollback()
        raise HTTPException(status_code=422, detail="invalid role") from exc
    except EmailAlreadyExists as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="email already exists") from exc
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="email already exists") from exc
