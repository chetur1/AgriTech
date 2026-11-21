"""
AGRI SMART — Database Models (Authentication & Roles)
File: backend/app/models/user.py

Defines:
- User: Central user account (farmer, expert, admin)
- FarmerProfile: Extended profile for farmers
- ExpertProfile: Extended profile & credential verification for experts
- AuditLog: Immutable security audit log
"""

import uuid
from enum import Enum as PyEnum
from datetime import datetime

from sqlalchemy import String, Boolean, Enum, Text, Float, Integer, ForeignKey, DateTime, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base_class import Base


class UserRole(str, PyEnum):
    """User roles in AGRI SMART."""
    FARMER = "farmer"
    EXPERT = "expert"
    ADMIN = "admin"
    BUYER = "buyer"
    BROKER = "broker"
    CONSUMER = "consumer"
    SERVICE_PROVIDER = "service_provider"


class UserStatus(str, PyEnum):
    """Account status lifecycle."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"  # default for new experts


class VerificationStatus(str, PyEnum):
    """Verification state for agricultural experts."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class User(Base):
    """
    Central user record for all platform roles.
    """
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )
    mobile: Mapped[str] = mapped_column(
        String(15), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(Text, nullable=False)

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=False),
        nullable=False,
        index=True,
        default=UserRole.FARMER,
    )
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status", native_enum=False),
        nullable=False,
        default=UserStatus.ACTIVE,
        index=True,
    )

    preferred_language: Mapped[str] = mapped_column(
        String(10), nullable=False, default="en"
    )  # 'kn', 'en', 'hi', 'te', 'ta'
    profile_photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    village: Mapped[str | None] = mapped_column(String(100), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    mobile_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    farmer_profile: Mapped["FarmerProfile | None"] = relationship(
        "FarmerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    expert_profile: Mapped["ExpertProfile | None"] = relationship(
        "ExpertProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", foreign_keys="ExpertProfile.user_id"
    )
    buyer_profile: Mapped["BuyerProfile | None"] = relationship(
        "BuyerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", foreign_keys="BuyerProfile.user_id"
    )
    consumer_profile: Mapped["ConsumerProfile | None"] = relationship(
        "ConsumerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", foreign_keys="ConsumerProfile.user_id"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} name={self.full_name!r} role={self.role}>"


class FarmerProfile(Base):
    """
    Detailed profile information for a Farmer.
    """
    __tablename__ = "farmer_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    total_land_acres: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.0)
    primary_crops: Mapped[str | None] = mapped_column(String(255), nullable=True)
    irrigation_source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)

    user: Mapped["User"] = relationship("User", back_populates="farmer_profile")


class ExpertProfile(Base):
    """
    Credentials and verification status for Agricultural Experts.
    """
    __tablename__ = "expert_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    qualifications: Mapped[str] = mapped_column(String(255), nullable=False)
    specialisation: Mapped[str] = mapped_column(String(255), nullable=False)
    experience_years: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    institution: Mapped[str] = mapped_column(String(255), nullable=False)
    credentials_document_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus, name="verification_status", native_enum=False),
        nullable=False,
        default=VerificationStatus.PENDING,
        index=True,
    )
    verified_by_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="expert_profile", foreign_keys=[user_id])


class AuditLog(Base):
    """
    Immutable audit trail for security events, authentication, and role transitions.
    """
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resource_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    resource_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
