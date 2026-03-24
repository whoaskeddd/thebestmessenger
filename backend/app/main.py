from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.db import dispose_engine
from app.core.logging import configure_logging
from app.api.auth.router import router as auth_router
from app.api.employees.router import router as employees_router
from app.api.leave_requests.router import router as leave_requests_router
from app.api.announcements.router import router as announcements_router
from app.api.hr_tasks.router import router as hr_tasks_router


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

    app.include_router(auth_router)
    app.include_router(employees_router)
    app.include_router(leave_requests_router)
    app.include_router(announcements_router)
    app.include_router(hr_tasks_router)

    @app.on_event("shutdown")
    async def _shutdown() -> None:
        await dispose_engine()

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/")
    async def index() -> dict[str, str]:
        return {"message": "hello!"}

    return app


app = create_app()
