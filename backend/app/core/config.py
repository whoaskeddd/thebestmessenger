from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=None, extra="ignore")

    app_name: str = Field(default="hr-api", validation_alias="APP_NAME")
    debug: bool = Field(default=True, validation_alias="DEBUG")
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@db:5432/postgres",
        validation_alias="DATABASE_URL",
    )

    jwt_secret_key: str = Field(default="dev-secret", validation_alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    access_token_ttl_minutes: int = Field(
        default=15, validation_alias="ACCESS_TOKEN_TTL_MINUTES"
    )
    refresh_token_ttl_days: int = Field(
        default=30, validation_alias="REFRESH_TOKEN_TTL_DAYS"
    )
    bootstrap_admin_email: str | None = Field(
        default=None, validation_alias="BOOTSTRAP_ADMIN_EMAIL"
    )
    bootstrap_admin_password: str | None = Field(
        default=None, validation_alias="BOOTSTRAP_ADMIN_PASSWORD"
    )

    media_root: str = Field(default="/data/media", validation_alias="MEDIA_ROOT")
    cors_allow_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:8081",
            "http://localhost:19006",
            "http://127.0.0.1:19006",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        validation_alias="CORS_ALLOW_ORIGINS",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
