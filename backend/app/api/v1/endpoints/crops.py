"""
AGRI SMART — Crop Management Endpoints
File: backend/app/api/v1/endpoints/crops.py
"""

import uuid
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User, UserRole
from app.models.farm import Farm
from app.models.crop import Crop, CropActivity
from app.schemas.crop import (
    CropCreate,
    CropUpdate,
    CropResponse,
    CropDetailResponse,
    CropActivityCreate,
    CropActivityResponse,
)

router = APIRouter()


# Preset agricultural calendar & crop knowledge database for Indian farming
CROP_CATALOG = [
    {
        "name": "Ragi (Finger Millet)",
        "variety_examples": ["GPU-28", "Indaf-8", "ML-365", "KMR-301", "MR-1"],
        "season": "Kharif",
        "duration_days": 120,
        "soil_types": ["Red Sandy Loam", "Red Loam", "Clay Loam"],
        "water_req_mm": 350,
        "stages": ["Germination (0-10d)", "Tillering (11-35d)", "Stem Elongation (36-60d)", "Panicle/Flowering (61-85d)", "Grain Filling & Maturity (86-120d)"]
    },
    {
        "name": "Paddy (Rice)",
        "variety_examples": ["BPT 5204 (Sona Masoori)", "IR-64", "JGL 1798", "MTU 1010", "Tellahamsa"],
        "season": "Kharif",
        "duration_days": 135,
        "soil_types": ["Clay Loam", "Alluvial", "Heavy Clay"],
        "water_req_mm": 1200,
        "stages": ["Nursery & Transplanting (0-25d)", "Tillering (26-55d)", "Panicle Initiation (56-80d)", "Flowering (81-105d)", "Ripening (106-135d)"]
    },
    {
        "name": "Cotton",
        "variety_examples": ["Bt Cotton RCH-2", "DCH-32", "Suraj", "Bunny Bt"],
        "season": "Kharif",
        "duration_days": 160,
        "soil_types": ["Deep Black Soil", "Medium Black Soil", "Alluvial"],
        "water_req_mm": 700,
        "stages": ["Seedling (0-20d)", "Vegetative (21-45d)", "Square formation (46-70d)", "Boll development (71-120d)", "Boll bursting & picking (121-160d)"]
    },
    {
        "name": "Tomato",
        "variety_examples": ["Arka Rakshak", "Arka Samrat", "Abhinav", "US-440", "Shivam"],
        "season": "Rabi",
        "duration_days": 110,
        "soil_types": ["Red Loamy", "Sandy Loam", "Well-drained Black"],
        "water_req_mm": 500,
        "stages": ["Nursery (0-25d)", "Vegetative (26-50d)", "Flowering (51-70d)", "Fruit development (71-95d)", "Harvesting (96-120d)"]
    },
    {
        "name": "Maize (Corn)",
        "variety_examples": ["DeKalb 9108", "Pioneer 3396", "NAH-2049", "CP-818"],
        "season": "Kharif",
        "duration_days": 105,
        "soil_types": ["Loamy", "Red Loam", "Black Soil"],
        "water_req_mm": 500,
        "stages": ["Emergence (0-10d)", "Vegetative/Knee-high (11-40d)", "Tasseling/Silking (41-65d)", "Grain Filling (66-90d)", "Physiological Maturity (91-105d)"]
    },
    {
        "name": "Groundnut (Peanut)",
        "variety_examples": ["TMV-2", "Kadiri-6", "TAG-24", "GPBD-4", "K-9"],
        "season": "Kharif",
        "duration_days": 115,
        "soil_types": ["Sandy Loam", "Red Sandy", "Light Loam"],
        "water_req_mm": 450,
        "stages": ["Emergence (0-10d)", "Vegetative (11-30d)", "Flowering & Pegging (31-60d)", "Pod Development (61-90d)", "Maturity & Harvest (91-115d)"]
    },
    {
        "name": "Sugarcane",
        "variety_examples": ["Co 86032", "Co 0238", "Co 62175", "CoM 0265"],
        "season": "Annual",
        "duration_days": 360,
        "soil_types": ["Deep Loam", "Clay Loam", "Alluvial"],
        "water_req_mm": 1800,
        "stages": ["Germination (0-45d)", "Tillering (46-120d)", "Grand Growth (121-270d)", "Maturity & Ripening (271-360d)"]
    }
]


@router.get("/catalog")
def get_crop_catalog():
    """
    Get predefined Indian crop varieties, durations, and growth stages.
    """
    return CROP_CATALOG


@router.get("", response_model=List[CropResponse])
def list_crops(
    farm_id: Optional[uuid.UUID] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List crops for the authenticated farmer, optionally filtered by farm or status.
    """
    query = db.query(Crop).join(Farm, Crop.farm_id == Farm.id)

    if current_user.role != UserRole.ADMIN:
        query = query.filter(Crop.farmer_id == current_user.id)

    if farm_id:
        query = query.filter(Crop.farm_id == farm_id)

    if status_filter:
        query = query.filter(Crop.status == status_filter)

    crops = query.order_by(Crop.created_at.desc()).all()

    results = []
    for crop in crops:
        activities_count = db.query(func.count(CropActivity.id)).filter(CropActivity.crop_id == crop.id).scalar() or 0
        crop_dict = {c.name: getattr(crop, c.name) for c in crop.__table__.columns}
        crop_dict["farm_name"] = crop.farm.name if crop.farm else "Unknown Farm"
        crop_dict["activities_count"] = activities_count
        results.append(CropResponse(**crop_dict))

    return results


@router.post("", response_model=CropResponse, status_code=status.HTTP_201_CREATED)
def create_crop(
    crop_in: CropCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Register a new crop planted on a specific farm.
    """
    farm = db.query(Farm).filter(Farm.id == crop_in.farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Selected farm not found")

    if current_user.role != UserRole.ADMIN and farm.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not own this farm")

    crop = Crop(
        farm_id=crop_in.farm_id,
        farmer_id=current_user.id,
        crop_name=crop_in.crop_name,
        variety=crop_in.variety,
        season=crop_in.season,
        area_acres=crop_in.area_acres,
        sowing_date=crop_in.sowing_date,
        expected_harvest_date=crop_in.expected_harvest_date,
        actual_harvest_date=crop_in.actual_harvest_date,
        status=crop_in.status,
        target_yield_quintals=crop_in.target_yield_quintals,
        actual_yield_quintals=crop_in.actual_yield_quintals,
        notes=crop_in.notes,
    )
    db.add(crop)
    db.commit()
    db.refresh(crop)

    crop_dict = {c.name: getattr(crop, c.name) for c in crop.__table__.columns}
    crop_dict["farm_name"] = farm.name
    crop_dict["activities_count"] = 0
    return CropResponse(**crop_dict)


@router.get("/{crop_id}", response_model=CropDetailResponse)
def get_crop(
    crop_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get details of a crop including its activities history.
    """
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    if current_user.role != UserRole.ADMIN and crop.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this crop")

    activities = db.query(CropActivity).filter(CropActivity.crop_id == crop.id).order_by(CropActivity.activity_date.desc()).all()

    crop_dict = {c.name: getattr(crop, c.name) for c in crop.__table__.columns}
    crop_dict["farm_name"] = crop.farm.name if crop.farm else "Unknown Farm"
    crop_dict["activities_count"] = len(activities)
    crop_dict["activities"] = [CropActivityResponse.model_validate(a) for a in activities]
    return CropDetailResponse(**crop_dict)


@router.patch("/{crop_id}", response_model=CropResponse)
def update_crop(
    crop_id: uuid.UUID,
    crop_in: CropUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update crop status, yield, dates, or notes.
    """
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    if current_user.role != UserRole.ADMIN and crop.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this crop")

    update_data = crop_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(crop, field, value)

    db.add(crop)
    db.commit()
    db.refresh(crop)

    activities_count = db.query(func.count(CropActivity.id)).filter(CropActivity.crop_id == crop.id).scalar() or 0
    crop_dict = {c.name: getattr(crop, c.name) for c in crop.__table__.columns}
    crop_dict["farm_name"] = crop.farm.name if crop.farm else "Unknown Farm"
    crop_dict["activities_count"] = activities_count
    return CropResponse(**crop_dict)


@router.delete("/{crop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crop(
    crop_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete a crop and its associated activity logs.
    """
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    if current_user.role != UserRole.ADMIN and crop.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this crop")

    db.delete(crop)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Activity Logging Endpoints
# ---------------------------------------------------------------------------

@router.post("/{crop_id}/activities", response_model=CropActivityResponse, status_code=status.HTTP_201_CREATED)
def add_crop_activity(
    crop_id: uuid.UUID,
    activity_in: CropActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Record an operation performed on a crop (fertilizer application, irrigation, spray, etc.)
    """
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    if current_user.role != UserRole.ADMIN and crop.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to log activities for this crop")

    activity = CropActivity(
        crop_id=crop_id,
        farmer_id=current_user.id,
        activity_type=activity_in.activity_type,
        activity_date=activity_in.activity_date,
        title=activity_in.title,
        description=activity_in.description,
        quantity=activity_in.quantity,
        quantity_unit=activity_in.quantity_unit,
        cost=activity_in.cost,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.get("/{crop_id}/activities", response_model=List[CropActivityResponse])
def list_crop_activities(
    crop_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List historical activities for a crop.
    """
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    if current_user.role != UserRole.ADMIN and crop.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view activities")

    return (
        db.query(CropActivity)
        .filter(CropActivity.crop_id == crop_id)
        .order_by(CropActivity.activity_date.desc())
        .all()
    )
