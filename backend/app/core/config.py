"""
AGRI SMART — Application Configuration
File: backend/app/core/config.py
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import os


class Settings(BaseSettings):
    # --- Application ---
    APP_NAME: str = "AGRI SMART"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_SECRET_KEY: str = "change-this-in-production-min-32-chars-long"
    FRONTEND_URL: str = "http://localhost:5173"

    # --- Database ---
    USE_SQLITE_DEV: bool = True
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "agrismart_db"
    DB_USER: str = "agrismart_user"
    DB_PASSWORD: str = "changeme"
    DATABASE_URL: str = ""

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v, info):
        """Build the DATABASE_URL from parts if not set directly."""
        if v:
            return v
        data = info.data
        if data.get("USE_SQLITE_DEV"):
            return "sqlite:///./agrismart_dev.db"
        return (
            f"postgresql+psycopg://{data.get('DB_USER')}:{data.get('DB_PASSWORD')}"
            f"@{data.get('DB_HOST')}:{data.get('DB_PORT')}/{data.get('DB_NAME')}"
        )

    # --- JWT ---
    JWT_SECRET_KEY: str = "change-this-jwt-secret-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # --- File Uploads ---
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_TYPES: str = "image/jpeg,image/png,image/webp"
    UPLOAD_DIR: str = "uploads"

    @property
    def allowed_image_types_list(self) -> List[str]:
        return [t.strip() for t in self.ALLOWED_IMAGE_TYPES.split(",")]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    # --- Weather ---
    WEATHER_PROVIDER: str = "open-meteo"

    # --- Ollama (Local LLM) ---
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "phi3:mini"

    # --- Optional External Services ---
    AGMARKNET_API_KEY: str = ""
    BHASHINI_USER_ID: str = ""
    BHASHINI_API_KEY: str = ""
    BHASHINI_PIPELINE_ID: str = ""
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
