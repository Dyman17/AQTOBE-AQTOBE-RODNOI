"""
QUNAR Configuration
Based on FastAPI full-stack template
"""

import json
import secrets
from pathlib import Path
from typing import List, Optional
from urllib.parse import quote_plus

from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Basic
    PROJECT_NAME: str = "QUNAR"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "qunar123"
    POSTGRES_DB: str = "qunar"
    SQLALCHEMY_DATABASE_URI: Optional[str] = None
    
    @property
    def DATABASE_URL(self) -> str:
        if self.SQLALCHEMY_DATABASE_URI:
            return self.SQLALCHEMY_DATABASE_URI
        quoted_password = quote_plus(self.POSTGRES_PASSWORD)
        return (
            f"postgresql://{self.POSTGRES_USER}:{quoted_password}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5500",
        "http://127.0.0.1:5501",
        "https://localhost:5173",
        "https://localhost:3000",
        "https://localhost:8080",
    ]
    
    # OpenAI
    OPENAI_API_KEY: str = ""

    # Admin bootstrap (one-time secret)
    ADMIN_BOOTSTRAP_TOKEN: Optional[str] = None
    
    # Email (optional)
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    # Test user
    FIRST_SUPERUSER_EMAIL: Optional[str] = "admin@qunar.com"
    FIRST_SUPERUSER_PASSWORD: Optional[str] = "admin123"
    
    # Environment
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: object) -> List[str]:
        if isinstance(v, list):
            return v
        if v is None:
            return []
        if isinstance(v, str):
            value = v.strip()
            if not value:
                return []
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                return [item.strip() for item in value.split(",") if item.strip()]
        return list(v)  # type: ignore[arg-type]

    class Config:
        env_file = str(Path(__file__).resolve().parents[2] / ".env")
        case_sensitive = True

settings = Settings()
