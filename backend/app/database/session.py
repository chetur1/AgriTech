"""
AGRI SMART — Database Session Factory with Auto-Fallback
File: backend/app/database/session.py
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os

from app.core.config import settings

def get_engine():
    db_url = settings.DATABASE_URL
    is_sqlite = db_url.startswith("sqlite")
    
    if is_sqlite:
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            echo=settings.APP_DEBUG,
        )
    else:
        return create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            echo=settings.APP_DEBUG,
        )

engine = get_engine()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

def get_db() -> Generator[Session, None, None]:
    """FastAPI request dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
