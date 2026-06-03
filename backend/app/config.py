"""Application configuration loaded from environment variables.

Nothing is hardcoded here. All sensitive values (database URL, credentials)
must be provided via environment variables / a .env file. See .env.example.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Full SQLAlchemy database URL, e.g.
    # postgresql+psycopg://user:password@host:5432/dbname
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@db:5432/inventory"

    # Comma-separated list of origins allowed by CORS, e.g.
    # "http://localhost:5173,https://my-frontend.vercel.app"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # A product at or below this stock level is flagged "low stock".
    LOW_STOCK_THRESHOLD: int = 10

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
