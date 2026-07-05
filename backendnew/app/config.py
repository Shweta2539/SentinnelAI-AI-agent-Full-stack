"""
config.py
=========
Centralized application configuration.

All configuration values are loaded from environment variables (via a .env
file in development). Nothing sensitive is ever hardcoded here — this module
only defines defaults and types, the real values come from the environment.
"""

import os
from functools import lru_cache
from typing import List

from dotenv import load_dotenv

# Load variables from a .env file into the process environment.
# In production, real environment variables should be set directly and this
# call becomes a harmless no-op if no .env file exists.
load_dotenv()


class Settings:
    """
    Application settings loaded from environment variables.

    Using a plain class (rather than a global dict) keeps things simple,
    typed, and easy to import anywhere via `get_settings()`.
    """

    # --- Application metadata ---
    APP_NAME: str = os.getenv("APP_NAME", "SentinelAI Backend")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # --- Database ---
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sentinel.db")

    # --- JWT Authentication ---
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    # --- File Uploads ---
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    REPORTS_DIR: str = os.getenv("REPORTS_DIR", "reports")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
    MAX_UPLOAD_SIZE_BYTES: int = MAX_UPLOAD_SIZE_MB * 1024 * 1024

    ALLOWED_UPLOAD_EXTENSIONS: List[str] = [
        ext.strip().lower()
        for ext in os.getenv("ALLOWED_UPLOAD_EXTENSIONS", ".txt,.csv,.log").split(",")
        if ext.strip()
    ]

    # --- CORS ---
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "*").split(",")
        if origin.strip()
    ]

    def __init__(self) -> None:
        # Fail fast in non-development environments if the secret key was
        # left at an insecure default or empty.
        if not self.SECRET_KEY:
            if self.ENVIRONMENT == "development":
                # Provide a random-ish fallback so local dev doesn't crash,
                # but this should NEVER happen in production.
                self.SECRET_KEY = "dev-only-insecure-secret-change-me"
            else:
                raise RuntimeError(
                    "SECRET_KEY environment variable must be set in "
                    "non-development environments."
                )


@lru_cache()
def get_settings() -> Settings:
    """
    Return a cached Settings instance.

    lru_cache ensures the environment is only read once per process,
    while still allowing `get_settings()` to be used as a FastAPI
    dependency if needed.
    """
    return Settings()


# Convenience module-level instance for simple imports:
#   from app.config import settings
settings = get_settings()
