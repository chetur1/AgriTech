"""
AGRI SMART — Buyer & Consumer Profile Models
File: backend/app/models/marketplace.py

Defines:
- BuyerProfile: Extended profile for agricultural produce buyers / brokers
- ConsumerProfile: Extended profile for end consumers who want fresh farm produce
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Enum, Text, Float, Integer, ForeignKey, DateTime, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base_class import Base


class BuyerProfile(Base):
    """
    Profile for buyers / brokers who purchase agricultural produce from farmers.
    Includes business details, commodity interests, and verification status.
    """
    __tablename__ = "buyer_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False, index=True,
    )

    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    business_type: Mapped[str] = mapped_column(
        String(100), nullable=False, default="Trader"
    )  # Trader, Wholesaler, Miller, Processor, Exporter, FPO
    gst_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    license_number: Mapped[str | None] = mapped_column(String(100), nullable=True)

    commodities_of_interest: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # comma-separated: "Ragi, Paddy, Groundnut"
    preferred_districts: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # comma-separated: "Mandya, Mysuru, Hassan"
    warehouse_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    max_purchase_quintal: Mapped[float | None] = mapped_column(Float, nullable=True)

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="buyer_profile", foreign_keys=[user_id])


class ConsumerProfile(Base):
    """
    Profile for end consumers who want to buy fresh produce directly from farmers.
    """
    __tablename__ = "consumer_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False, index=True,
    )

    delivery_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_commodities: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # comma-separated: "Rice, Ragi Flour, Groundnut Oil"
    is_organic_preferred: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    household_size: Mapped[int | None] = mapped_column(Integer, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="consumer_profile", foreign_keys=[user_id])
