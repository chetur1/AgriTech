"""
AGRI SMART — AI Diagnosis Schemas
File: backend/app/schemas/ai_diagnosis.py
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class AIDiagnosisBase(BaseModel):
    crop_name: str
    predicted_disease: str
    vernacular_name: str
    confidence_score: float
    severity: str
    is_healthy: bool
    symptoms: list[str] = []
    possible_causes: list[str] = []
    safe_treatment_organic: list[str] = []
    chemical_treatment: list[str] = []
    prevention: list[str] = []


class AIDiagnosisResponse(AIDiagnosisBase):
    id: uuid.UUID
    farmer_id: uuid.UUID
    crop_id: uuid.UUID | None = None
    image_url: str
    is_expert_verified: bool
    verified_by_id: uuid.UUID | None = None
    expert_notes: str | None = None
    expert_diagnosis_override: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExpertVerificationRequest(BaseModel):
    action: str = Field(..., description="approve or correct")
    corrected_disease: str | None = None
    expert_notes: str = Field(..., min_length=5, description="Professional observations")
