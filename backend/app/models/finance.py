"""
AGRI SMART — Farm Finance Models
File: backend/app/models/finance.py

Tracks per-farmer income and expense records to enable profit/loss
analysis across seasons, farms, and crops.
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Float, ForeignKey, DateTime, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base_class import Base


class Expense(Base):
    """
    Records a single expenditure made by a farmer for farming operations.

    Allowed category values (enforced at API layer):
      "Seed", "Fertilizer", "Pesticide", "Labour", "Machinery",
      "Irrigation", "Transport", "Other"
    """

    __tablename__ = "expenses"

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

    farm_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("farms.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    crop_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("crops.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Stored as plain VARCHAR — no DB-level enum so migrations stay portable
    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    amount: Mapped[float] = mapped_column(Float, nullable=False)

    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    expense_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    # e.g. "Kharif 2026", "Rabi 2026-27", "Annual 2026"
    season: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    farmer = relationship("User", foreign_keys=[farmer_id])

    def __repr__(self) -> str:
        return (
            f"<Expense id={self.id} farmer={self.farmer_id} "
            f"category={self.category!r} amount={self.amount}>"
        )


class Income(Base):
    """
    Records a single income event for a farmer — crop sales, government
    subsidies, or other agricultural receipts.

    Stores granular market data (buyer, market, price per quintal) so the
    platform can generate meaningful per-crop revenue reports.

    Allowed source values (enforced at API layer):
      "Crop Sale", "Government Subsidy", "Other"
    """

    __tablename__ = "incomes"

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

    farm_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("farms.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    crop_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("crops.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Stored as plain VARCHAR — no DB-level enum
    source: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    amount: Mapped[float] = mapped_column(Float, nullable=False)

    # Crop / commodity details (populated mainly for "Crop Sale" records)
    commodity: Mapped[str | None] = mapped_column(String(100), nullable=True)
    quantity_quintal: Mapped[float | None] = mapped_column(Float, nullable=True)
    selling_price_per_quintal: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Market / buyer provenance
    buyer_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    market_name: Mapped[str | None] = mapped_column(String(200), nullable=True)

    income_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    # e.g. "Kharif 2026", "Rabi 2026-27"
    season: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)

    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    farmer = relationship("User", foreign_keys=[farmer_id])

    def __repr__(self) -> str:
        return (
            f"<Income id={self.id} farmer={self.farmer_id} "
            f"source={self.source!r} amount={self.amount}>"
        )
