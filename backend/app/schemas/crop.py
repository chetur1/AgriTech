"""
AGRI SMART — Crop & Activity Schemas
File: backend/app/schemas/crop.py
"""

import uuid
from datetime import datetime, date
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Crop Activity Schemas
# ---------------------------------------------------------------------------

class CropActivityBase(BaseModel):
    activity_type: str = Field(..., description="sowing, irrigation, fertilizer, pesticide, weeding, harvesting, other")
    activity_date: date
    title: str = Field(..., min_length=2, max_length=200)
    description: str | None = None
    quantity: float | None = None
    quantity_unit: str | None = None
    cost: float = Field(default=0.0, ge=0)


class CropActivityCreate(CropActivityBase):
    pass


class CropActivityResponse(CropActivityBase):
    id: uuid.UUID
    crop_id: uuid.UUID
    farmer_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Crop Schemas
# ---------------------------------------------------------------------------

class CropBase(BaseModel):
    crop_name: str = Field(..., min_length=2, max_length=150)
    variety: str | None = None
    season: str = Field(default="Kharif")
    area_acres: float = Field(..., gt=0)
    sowing_date: date
    expected_harvest_date: date | None = None
    actual_harvest_date: date | None = None
    status: str = Field(default="sown", description="planned, sown, vegetative, flowering, maturity, harvested, failed")
    target_yield_quintals: float | None = None
    actual_yield_quintals: float | None = None
    notes: str | None = None


class CropCreate(CropBase):
    farm_id: uuid.UUID


class CropUpdate(BaseModel):
    crop_name: str | None = None
    variety: str | None = None
    season: str | None = None
    area_acres: float | None = None
    sowing_date: date | None = None
    expected_harvest_date: date | None = None
    actual_harvest_date: date | None = None
    status: str | None = None
    target_yield_quintals: float | None = None
    actual_yield_quintals: float | None = None
    notes: str | None = None


class CropResponse(CropBase):
    id: uuid.UUID
    farm_id: uuid.UUID
    farmer_id: uuid.UUID
    farm_name: str | None = None
    activities_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CropDetailResponse(CropResponse):
    activities: list[CropActivityResponse] = []
