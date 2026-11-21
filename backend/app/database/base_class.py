"""
AGRI SMART — SQLAlchemy Declarative Base
File: backend/app/database/base_class.py

All ORM models inherit from this Base.
It adds automatic created_at and updated_at timestamps.
"""

from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func
from datetime import datetime


class Base(DeclarativeBase):
    """Base class for all AGRI SMART database models."""

    # Every table automatically gets these two timestamp columns
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
