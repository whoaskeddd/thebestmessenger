from fastapi import FastAPI

from app.core.config import get_settings
from app.core.db import dispose_engine
from app.core.logging import configure_logging
from app.api.auth.router import router as auth_router


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(title=settings.app_name, debug=settings.debug)

    app.include_router(auth_router)

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
