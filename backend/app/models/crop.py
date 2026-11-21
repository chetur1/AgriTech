"""
AGRI SMART — Crop & Farm Activity Models
File: backend/app/models/crop.py

Represents individual crops cultivated on a farm and daily farming activities.
"""

import uuid
from datetime import datetime, date
from sqlalchemy import String, Float, ForeignKey, DateTime, Date, Uuid, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base_class import Base


class Crop(Base):
    """
    Crop lifecycle entity associated with a specific farm parcel.
    """
    __tablename__ = "crops"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    farmer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    crop_name: Mapped[str] = mapped_column(String(150), nullable=False) # e.g. "Ragi", "Paddy", "Tomato"
    variety: Mapped[str | None] = mapped_column(String(100), nullable=True) # e.g. "GPU-28", "Indaf-8"
    season: Mapped[str] = mapped_column(String(50), nullable=False, default="Kharif") # Kharif, Rabi, Zaid, Summer, Annual
    area_acres: Mapped[float] = mapped_column(Float, nullable=False)

    sowing_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_harvest_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_harvest_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Status: planned, sown, vegetative, flowering, maturity, harvested, failed
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="sown")

    target_yield_quintals: Mapped[float | None] = mapped_column(Float, nullable=True)
    actual_yield_quintals: Mapped[float | None] = mapped_column(Float, nullable=True)

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
    farm = relationship("Farm", back_populates="crops")
    activities = relationship("CropActivity", back_populates="crop", cascade="all, delete-orphan", order_by="desc(CropActivity.activity_date)")


class CropActivity(Base):
    """
    Log of agricultural operations performed on a crop (fertilizer, spray, irrigation, etc.)
    """
    __tablename__ = "crop_activities"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    crop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("crops.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    farmer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Activity type: sowing, irrigation, fertilizer, pesticide, weeding, pruning, harvesting, other
    activity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    activity_date: Mapped[date] = mapped_column(Date, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Resource usage tracking
    quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    quantity_unit: Mapped[str | None] = mapped_column(String(30), nullable=True) # kg, L, bags, hrs
    cost: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    crop = relationship("Crop", back_populates="activities")
