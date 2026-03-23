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

    media_root: str = Field(default="/data/media", validation_alias="MEDIA_ROOT")


@lru_cache
def get_settings() -> Settings:
    return Settings()

