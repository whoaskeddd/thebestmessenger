from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.auth.exceptions import BootstrapAdminConfigError
from app.domain.auth.use_cases import AuthService
from app.infrastructure.auth.repositories import (
    SQLAlchemyRefreshSessionRepository,
    SQLAlchemyUserRepository,
)


logger = logging.getLogger(__name__)


async def ensure_bootstrap_admin(session: AsyncSession) -> None:
    service = AuthService(
        users=SQLAlchemyUserRepository(session),
        refresh_sessions=SQLAlchemyRefreshSessionRepository(session),
    )
    try:
        created = await service.ensure_bootstrap_admin()
        if created:
            await session.commit()
            logger.info("Bootstrap admin user created")
    except BootstrapAdminConfigError:
        await session.rollback()
        raise
    except Exception:
        await session.rollback()
        raise
