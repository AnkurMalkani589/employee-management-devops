"""Application configuration loaded from environment variables.

All settings are driven by environment variables so the same image can run in
local, CI and production without code changes. No secret is ever hardcoded.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings.

    Values come from (in order of precedence):
      1. Real environment variables (used in Docker / CI / production).
      2. A local ``.env`` file (used only for local development).
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- Application ---
    app_name: str = Field(default="Employee Management API")
    app_version: str = "1.0.0"
    environment: str = Field(default="development")
    log_level: str = Field(default="INFO")

    # --- Database ---
    # Full DSN wins when provided; otherwise it is assembled from the parts.
    database_url: str | None = Field(default=None, alias="DATABASE_URL")
    postgres_user: str = Field(default="employee")
    postgres_password: str = Field(default="employee")
    postgres_db: str = Field(default="employees")
    postgres_host: str = Field(default="localhost")
    postgres_port: int = Field(default=5432)

    # --- Database pool / retry ---
    db_connect_retries: int = Field(default=10)
    db_connect_retry_delay_seconds: float = Field(default=1.5)

    # --- Seed control ---
    # Insert sample data on startup when the table is empty. Disabled in tests.
    seed_on_startup: bool = Field(default=True)

    # --- CORS ---
    # Comma separated list of allowed origins. Empty means "allow all" which is
    # acceptable for local dev where Nginx serves the frontend on the same
    # origin anyway.
    cors_origins: str = Field(default="")

    @property
    def sqlalchemy_database_uri(self) -> str:
        """Return the SQLAlchemy connection string.

        Prefers ``DATABASE_URL`` when set (e.g. by docker-compose or RDS) and
        otherwise composes one from the individual POSTGRES_* variables.
        """
        if self.database_url:
            url = self.database_url
            # Normalise the legacy postgres:// scheme used by some providers.
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+psycopg://", 1)
            elif url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+psycopg://", 1)
            return url
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def cors_origin_list(self) -> list[str]:
        """Return the CORS origins as a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
