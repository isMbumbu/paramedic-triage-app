from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Paramedic Triage API"
    environment: str = "local"
    database_url: str = "postgresql+asyncpg://triage:triage@localhost:5432/triage"
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="TRIAGE_")


@lru_cache
def get_settings() -> Settings:
    return Settings()
