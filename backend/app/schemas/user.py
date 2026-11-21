"""
AGRI SMART — User & Authentication Pydantic Schemas
File: backend/app/schemas/user.py
"""

import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.models.user import UserRole, UserStatus, VerificationStatus


# ---------------------------------------------------------------------------
# Base & Profile schemas
# ---------------------------------------------------------------------------

class FarmerProfileBase(BaseModel):
    total_land_acres: Optional[float] = 0.0
    primary_crops: Optional[str] = None
    irrigation_source: Optional[str] = None
    experience_years: Optional[int] = 0


class FarmerProfileResponse(FarmerProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ExpertProfileBase(BaseModel):
    qualifications: str
    specialisation: str
    experience_years: int = Field(default=1, ge=0)
    institution: str


class ExpertProfileResponse(ExpertProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    verification_status: VerificationStatus
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BuyerProfileBase(BaseModel):
    business_name: str
    business_type: str = "Trader"
    gst_number: Optional[str] = None
    license_number: Optional[str] = None
    commodities_of_interest: Optional[str] = None
    preferred_districts: Optional[str] = None
    warehouse_address: Optional[str] = None
    max_purchase_quintal: Optional[float] = None


class BuyerProfileResponse(BuyerProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    is_verified: bool = False
    verified_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConsumerProfileBase(BaseModel):
    delivery_address: Optional[str] = None
    preferred_commodities: Optional[str] = None
    is_organic_preferred: bool = False
    household_size: Optional[int] = None


class ConsumerProfileResponse(ConsumerProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Registration Requests
# ---------------------------------------------------------------------------

class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=200)
    mobile: str = Field(..., pattern=r"^\d{10}$", description="10-digit Indian mobile number")
    password: str = Field(..., min_length=8, max_length=128)
    role: UserRole = UserRole.FARMER
    preferred_language: str = Field(default="en", max_length=10)
    state: Optional[str] = Field(default=None, max_length=100)
    district: Optional[str] = Field(default=None, max_length=100)
    village: Optional[str] = Field(default=None, max_length=100)

    # Optional fields for expert
    email: Optional[EmailStr] = None
    qualifications: Optional[str] = None
    specialisation: Optional[str] = None
    institution: Optional[str] = None
    experience_years: Optional[int] = 1

    # Optional fields for farmer
    total_land_acres: Optional[float] = 0.0
    primary_crops: Optional[str] = None

    # Optional fields for buyer
    business_name: Optional[str] = None
    business_type: Optional[str] = "Trader"
    gst_number: Optional[str] = None
    license_number: Optional[str] = None
    commodities_of_interest: Optional[str] = None
    preferred_districts: Optional[str] = None
    warehouse_address: Optional[str] = None

    # Optional fields for consumer
    delivery_address: Optional[str] = None
    preferred_commodities: Optional[str] = None
    is_organic_preferred: Optional[bool] = False
    household_size: Optional[int] = None

    @field_validator("email", mode="before")
    @classmethod
    def clean_email(cls, v):
        if v is None:
            return None
        if isinstance(v, str) and not v.strip():
            return None
        return v

    @field_validator("email")
    @classmethod
    def check_email_for_expert(cls, v, info):
        if info.data.get("role") == UserRole.EXPERT and not v:
            raise ValueError("Email is mandatory for Agricultural Expert registration.")
        return v


# ---------------------------------------------------------------------------
# Login & Token Requests / Responses
# ---------------------------------------------------------------------------

class UserLoginRequest(BaseModel):
    mobile_or_email: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    password: str

    @model_validator(mode="after")
    def assemble_identifier(self):
        if not self.mobile_or_email:
            self.mobile_or_email = self.mobile or self.email
        if not self.mobile_or_email:
            raise ValueError("Please provide your mobile number, email, or name.")
        return self


class UserResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    mobile: str
    email: Optional[str] = None
    role: UserRole
    status: UserStatus
    preferred_language: str
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    profile_photo_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    farmer_profile: Optional[FarmerProfileResponse] = None
    expert_profile: Optional[ExpertProfileResponse] = None
    buyer_profile: Optional[BuyerProfileResponse] = None
    consumer_profile: Optional[ConsumerProfileResponse] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserStatusUpdateRequest(BaseModel):
    status: UserStatus
    reason: Optional[str] = None


class ExpertVerificationRequest(BaseModel):
    status: VerificationStatus  # APPROVED or REJECTED
    rejection_reason: Optional[str] = None


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
