"""
AGRI SMART — AI Crop Diagnosis Model
File: backend/app/models/ai_diagnosis.py

Stores AI-generated leaf disease predictions, confidence metrics,
recommended safe treatments, and human expert verification records.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Float, ForeignKey, DateTime, Uuid, Text, Boolean, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base_class import Base


class AIDiagnosis(Base):
    """
    AI Diagnosis record for uploaded crop leaf photographs.
    """
    __tablename__ = "ai_diagnoses"

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

    crop_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("crops.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    crop_name: Mapped[str] = mapped_column(String(100), nullable=False)
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)

    # Prediction outputs
    predicted_disease: Mapped[str] = mapped_column(String(150), nullable=False)
    vernacular_name: Mapped[str] = mapped_column(String(200), nullable=False) # e.g. Kannada/Hindi name
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False) # 0.0 to 1.0
    severity: Mapped[str] = mapped_column(String(30), nullable=False, default="Moderate") # Mild, Moderate, Severe
    is_healthy: Mapped[bool] = mapped_column(Boolean, default=False)

    # Detailed diagnostic guidance (Stored as structured JSON)
    symptoms: Mapped[list] = mapped_column(JSON, default=list)
    possible_causes: Mapped[list] = mapped_column(JSON, default=list)
    safe_treatment_organic: Mapped[list] = mapped_column(JSON, default=list)
    chemical_treatment: Mapped[list] = mapped_column(JSON, default=list)
    prevention: Mapped[list] = mapped_column(JSON, default=list)

    # Expert verification audit trail
    is_expert_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_by_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    expert_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    expert_diagnosis_override: Mapped[str | None] = mapped_column(String(150), nullable=True)

    # Lifecycle status: predicted, pending_expert_review, expert_approved, expert_corrected
    status: Mapped[str] = mapped_column(String(50), default="predicted", nullable=False)

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
    farmer = relationship("User", foreign_keys=[farmer_id], backref="diagnoses")
    verified_by = relationship("User", foreign_keys=[verified_by_id])
