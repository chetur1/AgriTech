"""
AGRI SMART — Farm Schemas
File: backend/app/schemas/farm.py
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class FarmBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    state: str = Field(default="Karnataka", max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    taluk: str | None = Field(None, max_length=100)
    village: str | None = Field(None, max_length=150)
    survey_number: str | None = Field(None, max_length=50)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    total_area: float = Field(..., gt=0, description="Total area of farm parcel")
    area_unit: str = Field(default="acres", description="acres, guntas, or hectares")
    soil_type: str = Field(default="Red Sandy Loam")
    water_source: str = Field(default="Borewell")
    irrigation_type: str = Field(default="Drip Irrigation")
    ownership_type: str = Field(default="Owned")
    notes: str | None = None


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    name: str | None = None
    state: str | None = None
    district: str | None = None
    taluk: str | None = None
    village: str | None = None
    survey_number: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    total_area: float | None = None
    area_unit: str | None = None
    soil_type: str | None = None
    water_source: str | None = None
    irrigation_type: str | None = None
    ownership_type: str | None = None
    notes: str | None = None


class FarmResponse(FarmBase):
    id: uuid.UUID
    farmer_id: uuid.UUID
    crops_count: int = 0
    active_crops_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
