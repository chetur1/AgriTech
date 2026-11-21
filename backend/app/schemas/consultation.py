"""
AGRI SMART — Consultation Schemas
File: backend/app/schemas/consultation.py
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    message: str = Field(..., min_length=2, max_length=3000)


class MessageResponse(BaseModel):
    id: uuid.UUID
    consultation_id: uuid.UUID
    sender_id: uuid.UUID
    sender_name: str
    sender_role: str
    message: str
    is_expert_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ConsultationCreate(BaseModel):
    subject: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    category: str = Field(default="Crop Disease")
    urgency: str = Field(default="Medium")
    crop_id: Optional[uuid.UUID] = None
    diagnosis_id: Optional[uuid.UUID] = None


class ConsultationResponse(BaseModel):
    id: uuid.UUID
    farmer_id: uuid.UUID
    farmer_name: Optional[str] = None
    farmer_district: Optional[str] = None
    assigned_expert_id: Optional[uuid.UUID] = None
    assigned_expert_name: Optional[str] = None
    crop_id: Optional[uuid.UUID] = None
    diagnosis_id: Optional[uuid.UUID] = None
    subject: str
    description: str
    category: str
    urgency: str
    status: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True


class ConsultationStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(open|assigned|in_progress|answered|closed)$")
