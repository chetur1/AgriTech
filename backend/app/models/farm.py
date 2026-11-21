"""
AGRI SMART — Farm Model
File: backend/app/models/farm.py

Represents agricultural land parcels owned or managed by farmers.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Float, ForeignKey, DateTime, Uuid, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base_class import Base


class Farm(Base):
    """
    Farm entity representing a registered land parcel.
    """
    __tablename__ = "farms"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    farmer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False, default="Karnataka")
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    taluk: Mapped[str | None] = mapped_column(String(100), nullable=True)
    village: Mapped[str | None] = mapped_column(String(150), nullable=True)
    survey_number: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # GPS coordinates for hyper-local weather & satellite tracking
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Land details
    total_area: Mapped[float] = mapped_column(Float, nullable=False)
    area_unit: Mapped[str] = mapped_column(String(20), default="acres")  # acres, guntas, hectares

    # Agricultural characteristics
    soil_type: Mapped[str] = mapped_column(String(80), nullable=False, default="Red Sandy Loam")
    water_source: Mapped[str] = mapped_column(String(100), nullable=False, default="Borewell")
    irrigation_type: Mapped[str] = mapped_column(String(80), nullable=False, default="Drip Irrigation")
    ownership_type: Mapped[str] = mapped_column(String(50), nullable=False, default="Owned")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

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

    # Relationships
    farmer = relationship("User", backref="farms")
    crops = relationship("Crop", back_populates="farm", cascade="all, delete-orphan")
