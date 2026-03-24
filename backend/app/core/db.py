from __future__ import annotations

from collections.abc import AsyncIterator
from functools import lru_cache

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings


@lru_cache
def create_engine() -> AsyncEngine:
    settings = get_settings()
    return create_async_engine(settings.database_url, pool_pre_ping=True)


@lru_cache
def create_sessionmaker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False)


async def get_db_session() -> AsyncIterator[AsyncSession]:
    engine = create_engine()
    sessionmaker = create_sessionmaker(engine)
    async with sessionmaker() as session:
        yield session


async def dispose_engine() -> None:
    engine = create_engine()
    await engine.dispose()
