"""
AGRI SMART — Farmer Specific Endpoints
File: backend/app/api/v1/endpoints/farmers.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User, UserRole, FarmerProfile
from app.schemas.user import UserResponse, FarmerProfileBase, FarmerProfileResponse
from app.api.deps import require_role

router = APIRouter()


@router.get("/profile", response_model=FarmerProfileResponse)
def get_farmer_profile(
    current_user: User = Depends(require_role(UserRole.FARMER)),
    db: Session = Depends(get_db),
):
    """Get the current farmer's land and crop profile."""
    if not current_user.farmer_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farmer profile not found.")
    return FarmerProfileResponse.model_validate(current_user.farmer_profile)


@router.put("/profile", response_model=FarmerProfileResponse)
def update_farmer_profile(
    profile_in: FarmerProfileBase,
    current_user: User = Depends(require_role(UserRole.FARMER)),
    db: Session = Depends(get_db),
):
    """Update farmer's land and crop information."""
    profile = current_user.farmer_profile
    if not profile:
        profile = FarmerProfile(user_id=current_user.id)
        db.add(profile)

    for field, value in profile_in.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return FarmerProfileResponse.model_validate(profile)
