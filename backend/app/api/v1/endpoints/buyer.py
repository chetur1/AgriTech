"""
AGRI SMART — Buyer / Broker API Endpoints
File: backend/app/api/v1/endpoints/buyer.py

Endpoints:
  GET  /dashboard        — buyer dashboard overview
  GET  /produce          — browse farmer produce listings
  POST /enquiry          — send purchase enquiry to a farmer
  GET  /enquiries        — list own enquiries
  GET  /profile          — get buyer profile
  PUT  /profile          — update buyer profile
"""

from __future__ import annotations

import uuid
import json
import os
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, require_role
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.marketplace import BuyerProfile

router = APIRouter()

ENQUIRIES_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))), "buyer_enquiries.json")


def _read_enquiries() -> list:
    if os.path.exists(ENQUIRIES_FILE):
        with open(ENQUIRIES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def _write_enquiries(data: list):
    with open(ENQUIRIES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class BuyerDashboardResponse(BaseModel):
    total_enquiries: int = 0
    pending_enquiries: int = 0
    accepted_enquiries: int = 0
    commodities_tracked: int = 0
    business_name: str = ""
    business_type: str = ""
    is_verified: bool = False


class ProduceListingResponse(BaseModel):
    id: str
    farmer_name: str
    commodity: str
    quantity_quintal: float
    expected_price_per_quintal: float
    district: str
    state: str
    harvest_date: str
    quality_grade: str
    is_organic: bool = False


class EnquiryCreate(BaseModel):
    produce_id: str
    commodity: str
    quantity_quintal: float = Field(..., gt=0)
    offered_price_per_quintal: float = Field(..., gt=0)
    message: Optional[str] = None
    delivery_location: Optional[str] = None


class EnquiryResponse(BaseModel):
    id: str
    buyer_id: str
    buyer_name: str
    produce_id: str
    commodity: str
    quantity_quintal: float
    offered_price_per_quintal: float
    message: Optional[str] = None
    delivery_location: Optional[str] = None
    status: str = "pending"  # pending | accepted | rejected | completed
    created_at: str


class BuyerProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    gst_number: Optional[str] = None
    license_number: Optional[str] = None
    commodities_of_interest: Optional[str] = None
    preferred_districts: Optional[str] = None
    warehouse_address: Optional[str] = None
    max_purchase_quintal: Optional[float] = None


# ---------------------------------------------------------------------------
# Sample produce listings (discoverable by buyers)
# ---------------------------------------------------------------------------

SAMPLE_PRODUCE = [
    {
        "id": "prod-001",
        "farmer_name": "Basavaraj Patil",
        "commodity": "Finger Millet (Ragi) — GPU 28",
        "quantity_quintal": 25.0,
        "expected_price_per_quintal": 3800.0,
        "district": "Mandya",
        "state": "Karnataka",
        "harvest_date": "2026-10-15",
        "quality_grade": "Grade A",
        "is_organic": False,
    },
    {
        "id": "prod-002",
        "farmer_name": "Manjunath Gowda",
        "commodity": "Paddy (Rice) — Sona Masuri",
        "quantity_quintal": 60.0,
        "expected_price_per_quintal": 2200.0,
        "district": "Mysuru",
        "state": "Karnataka",
        "harvest_date": "2026-11-20",
        "quality_grade": "Grade A",
        "is_organic": True,
    },
    {
        "id": "prod-003",
        "farmer_name": "Lakshmi Devi",
        "commodity": "Groundnut (TMV 2)",
        "quantity_quintal": 15.0,
        "expected_price_per_quintal": 5500.0,
        "district": "Chitradurga",
        "state": "Karnataka",
        "harvest_date": "2026-10-28",
        "quality_grade": "Grade B+",
        "is_organic": False,
    },
    {
        "id": "prod-004",
        "farmer_name": "Ravi Kumar",
        "commodity": "Maize (Hybrid DMH 849)",
        "quantity_quintal": 40.0,
        "expected_price_per_quintal": 2100.0,
        "district": "Davangere",
        "state": "Karnataka",
        "harvest_date": "2026-09-25",
        "quality_grade": "Grade A",
        "is_organic": False,
    },
    {
        "id": "prod-005",
        "farmer_name": "Shivamma",
        "commodity": "Tomato (Arka Rakshak F1)",
        "quantity_quintal": 30.0,
        "expected_price_per_quintal": 1200.0,
        "district": "Kolar",
        "state": "Karnataka",
        "harvest_date": "2026-11-05",
        "quality_grade": "Grade A",
        "is_organic": True,
    },
]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/dashboard", response_model=BuyerDashboardResponse)
def buyer_dashboard(
    current_user: User = Depends(require_role(UserRole.BUYER, UserRole.BROKER)),
    db: Session = Depends(get_db),
):
    """Get buyer dashboard overview stats."""
    enquiries = _read_enquiries()
    my_enquiries = [e for e in enquiries if e.get("buyer_id") == str(current_user.id)]

    profile = db.query(BuyerProfile).filter(BuyerProfile.user_id == current_user.id).first()

    commodities_count = 0
    if profile and profile.commodities_of_interest:
        commodities_count = len([c.strip() for c in profile.commodities_of_interest.split(",") if c.strip()])

    return BuyerDashboardResponse(
        total_enquiries=len(my_enquiries),
        pending_enquiries=len([e for e in my_enquiries if e.get("status") == "pending"]),
        accepted_enquiries=len([e for e in my_enquiries if e.get("status") == "accepted"]),
        commodities_tracked=commodities_count,
        business_name=profile.business_name if profile else "",
        business_type=profile.business_type if profile else "",
        is_verified=profile.is_verified if profile else False,
    )


@router.get("/produce", response_model=List[ProduceListingResponse])
def browse_produce(
    commodity: Optional[str] = None,
    district: Optional[str] = None,
    current_user: User = Depends(require_role(UserRole.BUYER, UserRole.BROKER)),
):
    """Browse available farmer produce listings."""
    results = SAMPLE_PRODUCE[:]
    if commodity:
        results = [p for p in results if commodity.lower() in p["commodity"].lower()]
    if district:
        results = [p for p in results if district.lower() in p["district"].lower()]
    return results


@router.post("/enquiry", response_model=EnquiryResponse, status_code=status.HTTP_201_CREATED)
def create_enquiry(
    body: EnquiryCreate,
    current_user: User = Depends(require_role(UserRole.BUYER, UserRole.BROKER)),
):
    """Send a purchase enquiry for a farmer's produce listing."""
    enquiries = _read_enquiries()
    enquiry = {
        "id": str(uuid.uuid4()),
        "buyer_id": str(current_user.id),
        "buyer_name": current_user.full_name,
        "produce_id": body.produce_id,
        "commodity": body.commodity,
        "quantity_quintal": body.quantity_quintal,
        "offered_price_per_quintal": body.offered_price_per_quintal,
        "message": body.message,
        "delivery_location": body.delivery_location,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
    }
    enquiries.append(enquiry)
    _write_enquiries(enquiries)
    return enquiry


@router.get("/enquiries", response_model=List[EnquiryResponse])
def list_enquiries(
    current_user: User = Depends(require_role(UserRole.BUYER, UserRole.BROKER)),
):
    """List all enquiries created by this buyer."""
    enquiries = _read_enquiries()
    return [e for e in enquiries if e.get("buyer_id") == str(current_user.id)]


@router.get("/profile")
def get_buyer_profile(
    current_user: User = Depends(require_role(UserRole.BUYER, UserRole.BROKER)),
    db: Session = Depends(get_db),
):
    """Get the buyer's business profile."""
    profile = db.query(BuyerProfile).filter(BuyerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Buyer profile not found.")
    return {
        "id": str(profile.id),
        "user_id": str(profile.user_id),
        "business_name": profile.business_name,
        "business_type": profile.business_type,
        "gst_number": profile.gst_number,
        "license_number": profile.license_number,
        "commodities_of_interest": profile.commodities_of_interest,
        "preferred_districts": profile.preferred_districts,
        "warehouse_address": profile.warehouse_address,
        "max_purchase_quintal": profile.max_purchase_quintal,
        "is_verified": profile.is_verified,
    }


@router.put("/profile")
def update_buyer_profile(
    updates: BuyerProfileUpdate,
    current_user: User = Depends(require_role(UserRole.BUYER, UserRole.BROKER)),
    db: Session = Depends(get_db),
):
    """Update buyer's business profile."""
    profile = db.query(BuyerProfile).filter(BuyerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Buyer profile not found.")

    for field, value in updates.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return {"message": "Profile updated successfully."}
