"""
AGRI SMART — Farm Management Endpoints
File: backend/app/api/v1/endpoints/farms.py
"""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User, UserRole
from app.models.farm import Farm
from app.models.crop import Crop
from app.schemas.farm import FarmCreate, FarmUpdate, FarmResponse

router = APIRouter()


@router.get("", response_model=List[FarmResponse])
def list_farms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List all farms owned by the logged-in farmer (or all if admin).
    """
    query = db.query(Farm)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Farm.farmer_id == current_user.id)
    
    farms = query.order_by(Farm.created_at.desc()).all()

    # Enrich with crop counts
    results = []
    for farm in farms:
        crops_count = db.query(func.count(Crop.id)).filter(Crop.farm_id == farm.id).scalar() or 0
        active_crops_count = db.query(func.count(Crop.id)).filter(
            Crop.farm_id == farm.id,
            Crop.status.notin_(["harvested", "failed"])
        ).scalar() or 0
        
        farm_dict = {c.name: getattr(farm, c.name) for c in farm.__table__.columns}
        farm_dict["crops_count"] = crops_count
        farm_dict["active_crops_count"] = active_crops_count
        results.append(FarmResponse(**farm_dict))

    return results


@router.post("", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
def create_farm(
    farm_in: FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Register a new agricultural farm parcel.
    """
    farm = Farm(
        farmer_id=current_user.id,
        name=farm_in.name,
        state=farm_in.state,
        district=farm_in.district,
        taluk=farm_in.taluk,
        village=farm_in.village,
        survey_number=farm_in.survey_number,
        latitude=farm_in.latitude,
        longitude=farm_in.longitude,
        total_area=farm_in.total_area,
        area_unit=farm_in.area_unit,
        soil_type=farm_in.soil_type,
        water_source=farm_in.water_source,
        irrigation_type=farm_in.irrigation_type,
        ownership_type=farm_in.ownership_type,
        notes=farm_in.notes,
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)

    farm_dict = {c.name: getattr(farm, c.name) for c in farm.__table__.columns}
    farm_dict["crops_count"] = 0
    farm_dict["active_crops_count"] = 0
    return FarmResponse(**farm_dict)


@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm(
    farm_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get detailed information for a specific farm.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    if current_user.role != UserRole.ADMIN and farm.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this farm")

    crops_count = db.query(func.count(Crop.id)).filter(Crop.farm_id == farm.id).scalar() or 0
    active_crops_count = db.query(func.count(Crop.id)).filter(
        Crop.farm_id == farm.id,
        Crop.status.notin_(["harvested", "failed"])
    ).scalar() or 0

    farm_dict = {c.name: getattr(farm, c.name) for c in farm.__table__.columns}
    farm_dict["crops_count"] = crops_count
    farm_dict["active_crops_count"] = active_crops_count
    return FarmResponse(**farm_dict)


@router.patch("/{farm_id}", response_model=FarmResponse)
def update_farm(
    farm_id: uuid.UUID,
    farm_in: FarmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update farm attributes.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    if current_user.role != UserRole.ADMIN and farm.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this farm")

    update_data = farm_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(farm, field, value)

    db.add(farm)
    db.commit()
    db.refresh(farm)

    crops_count = db.query(func.count(Crop.id)).filter(Crop.farm_id == farm.id).scalar() or 0
    active_crops_count = db.query(func.count(Crop.id)).filter(
        Crop.farm_id == farm.id,
        Crop.status.notin_(["harvested", "failed"])
    ).scalar() or 0

    farm_dict = {c.name: getattr(farm, c.name) for c in farm.__table__.columns}
    farm_dict["crops_count"] = crops_count
    farm_dict["active_crops_count"] = active_crops_count
    return FarmResponse(**farm_dict)


@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_farm(
    farm_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete a farm parcel and all its associated crops and activities.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    if current_user.role != UserRole.ADMIN and farm.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this farm")

    db.delete(farm)
    db.commit()
    return None
