from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.api.deps import DbSessionDep
from app.core.security import decode_access_token
from app.infrastructure.auth.repositories import SQLAlchemyUserRepository


bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    session: DbSessionDep,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="not authenticated")

    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token") from exc

    repo = SQLAlchemyUserRepository(session)
    user = await repo.get_by_id(payload.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")
    if user.token_version != payload.token_version:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token revoked")

    return user


def require_role(*allowed_roles: str):
    async def _dep(user=Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")
        return user

    return _dep
