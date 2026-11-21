"""
AGRI SMART — Consultation Database Model
File: backend/app/models/consultation.py

Supports farmer-to-expert advisory consultations, including question threads,
severity flags, AI diagnosis attachments, and expert verification.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Text, ForeignKey, DateTime, Uuid, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base_class import Base


class Consultation(Base):
    """
    Advisory consultation initiated by a farmer or escalated from AI diagnosis.
    """
    __tablename__ = "consultations"

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

    assigned_expert_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    crop_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("crops.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    diagnosis_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("ai_diagnoses.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="Crop Disease", nullable=False)
    urgency: Mapped[str] = mapped_column(String(50), default="Medium", nullable=False) # Low, Medium, High, Emergency
    status: Mapped[str] = mapped_column(String(50), default="open", nullable=False) # open, assigned, answered, closed

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
    farmer = relationship("User", foreign_keys=[farmer_id], backref="farmer_consultations")
    assigned_expert = relationship("User", foreign_keys=[assigned_expert_id], backref="expert_consultations")
    crop = relationship("Crop", foreign_keys=[crop_id])
    diagnosis = relationship("AIDiagnosis", foreign_keys=[diagnosis_id])
    messages = relationship("ConsultationMessage", back_populates="consultation", cascade="all, delete-orphan", order_by="ConsultationMessage.created_at.asc()")


class ConsultationMessage(Base):
    """
    Threaded message / advisory reply within a consultation.
    """
    __tablename__ = "consultation_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    consultation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("consultations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    sender_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    sender_name: Mapped[str] = mapped_column(String(200), nullable=False)
    sender_role: Mapped[str] = mapped_column(String(50), nullable=False) # farmer, expert, admin
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_expert_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationship
    consultation = relationship("Consultation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
