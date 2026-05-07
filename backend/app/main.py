from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.auth.bootstrap import ensure_bootstrap_admin
from app.core.config import get_settings
from app.core.db import create_engine, create_sessionmaker, dispose_engine
from app.domain.auth.exceptions import BootstrapAdminConfigError
from app.core.logging import configure_logging
from app.api.auth.router import router as auth_router
from app.api.employees.router import router as employees_router
from app.api.leave_requests.router import router as leave_requests_router
from app.api.announcements.router import router as announcements_router
from app.api.hr_tasks.router import router as hr_tasks_router
from app.api.messenger.router import router as messenger_router


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(title=settings.app_name, debug=settings.debug)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    Path(settings.media_root).mkdir(parents=True, exist_ok=True)
    app.mount("/media", StaticFiles(directory=settings.media_root), name="media")

    app.include_router(auth_router)
    app.include_router(employees_router)
    app.include_router(leave_requests_router)
    app.include_router(announcements_router)
    app.include_router(hr_tasks_router)
    app.include_router(messenger_router)

    @app.on_event("shutdown")
    async def _shutdown() -> None:
        await dispose_engine()

    @app.on_event("startup")
    async def _startup() -> None:
        sessionmaker = create_sessionmaker(create_engine())
        async with sessionmaker() as session:
            try:
                await ensure_bootstrap_admin(session)
            except BootstrapAdminConfigError as exc:
                raise RuntimeError(
                    "Invalid bootstrap admin config. Set both BOOTSTRAP_ADMIN_EMAIL and "
                    "BOOTSTRAP_ADMIN_PASSWORD, and make sure that existing user has role=admin."
                ) from exc

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/")
    async def index() -> dict[str, str]:
        return {"message": "hello!"}

    return app


app = create_app()
