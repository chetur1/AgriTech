"""
AGRI SMART — Consumer API Endpoints
File: backend/app/api/v1/endpoints/consumer.py

Endpoints:
  GET  /dashboard         — consumer dashboard overview
  GET  /marketplace       — browse fresh produce from farms
  POST /orders            — place order for produce
  GET  /orders            — list own orders
  GET  /profile           — get consumer profile
  PUT  /profile           — update consumer profile
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
from app.models.marketplace import ConsumerProfile

router = APIRouter()

ORDERS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))), "consumer_orders.json")


def _read_orders() -> list:
    if os.path.exists(ORDERS_FILE):
        with open(ORDERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def _write_orders(data: list):
    with open(ORDERS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ConsumerDashboardResponse(BaseModel):
    total_orders: int = 0
    pending_orders: int = 0
    delivered_orders: int = 0
    total_spent: float = 0.0
    is_organic_preferred: bool = False


class FarmProduceItem(BaseModel):
    id: str
    farmer_name: str
    commodity: str
    available_kg: float
    price_per_kg: float
    district: str
    state: str
    is_organic: bool = False
    freshness: str = "Harvested within 7 days"
    farm_name: str = ""


class OrderCreate(BaseModel):
    produce_id: str
    commodity: str
    quantity_kg: float = Field(..., gt=0)
    delivery_address: str
    contact_mobile: Optional[str] = None
    notes: Optional[str] = None


class OrderResponse(BaseModel):
    id: str
    consumer_id: str
    consumer_name: str
    produce_id: str
    commodity: str
    quantity_kg: float
    price_per_kg: float
    total_amount: float
    delivery_address: str
    contact_mobile: Optional[str] = None
    notes: Optional[str] = None
    status: str = "placed"  # placed | confirmed | dispatched | delivered | cancelled
    created_at: str


class ConsumerProfileUpdate(BaseModel):
    delivery_address: Optional[str] = None
    preferred_commodities: Optional[str] = None
    is_organic_preferred: Optional[bool] = None
    household_size: Optional[int] = None


# ---------------------------------------------------------------------------
# Sample fresh produce catalogue (from local farms)
# ---------------------------------------------------------------------------

FARM_PRODUCE = [
    {
        "id": "fp-001",
        "farmer_name": "Basavaraj Patil",
        "commodity": "Ragi Flour (Organic Stone-Ground)",
        "available_kg": 50.0,
        "price_per_kg": 65.0,
        "district": "Mandya",
        "state": "Karnataka",
        "is_organic": True,
        "freshness": "Milled within 3 days",
        "farm_name": "Patil Organic Farm",
    },
    {
        "id": "fp-002",
        "farmer_name": "Manjunath Gowda",
        "commodity": "Fresh Tomato (Vine-Ripened)",
        "available_kg": 100.0,
        "price_per_kg": 25.0,
        "district": "Kolar",
        "state": "Karnataka",
        "is_organic": True,
        "freshness": "Picked today",
        "farm_name": "Gowda Natural Farms",
    },
    {
        "id": "fp-003",
        "farmer_name": "Lakshmi Devi",
        "commodity": "Cold-Pressed Groundnut Oil",
        "available_kg": 20.0,
        "price_per_kg": 220.0,
        "district": "Chitradurga",
        "state": "Karnataka",
        "is_organic": True,
        "freshness": "Pressed this week",
        "farm_name": "Devi Oilseeds",
    },
    {
        "id": "fp-004",
        "farmer_name": "Ravi Kumar",
        "commodity": "Fresh Green Chillies",
        "available_kg": 30.0,
        "price_per_kg": 40.0,
        "district": "Dharwad",
        "state": "Karnataka",
        "is_organic": False,
        "freshness": "Harvested yesterday",
        "farm_name": "Kumar Farms",
    },
    {
        "id": "fp-005",
        "farmer_name": "Shivamma",
        "commodity": "Sona Masuri Rice (5 kg packs)",
        "available_kg": 200.0,
        "price_per_kg": 48.0,
        "district": "Mysuru",
        "state": "Karnataka",
        "is_organic": False,
        "freshness": "Polished this month",
        "farm_name": "Shivamma Paddy Fields",
    },
    {
        "id": "fp-006",
        "farmer_name": "Basavaraj Patil",
        "commodity": "Fresh Coconut (Tender)",
        "available_kg": 80.0,
        "price_per_kg": 18.0,
        "district": "Mandya",
        "state": "Karnataka",
        "is_organic": True,
        "freshness": "Harvested today",
        "farm_name": "Patil Organic Farm",
    },
]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/dashboard", response_model=ConsumerDashboardResponse)
def consumer_dashboard(
    current_user: User = Depends(require_role(UserRole.CONSUMER, UserRole.SERVICE_PROVIDER)),
    db: Session = Depends(get_db),
):
    """Consumer dashboard overview with order stats."""
    orders = _read_orders()
    my_orders = [o for o in orders if o.get("consumer_id") == str(current_user.id)]

    profile = db.query(ConsumerProfile).filter(ConsumerProfile.user_id == current_user.id).first()

    return ConsumerDashboardResponse(
        total_orders=len(my_orders),
        pending_orders=len([o for o in my_orders if o.get("status") in ("placed", "confirmed", "dispatched")]),
        delivered_orders=len([o for o in my_orders if o.get("status") == "delivered"]),
        total_spent=sum(o.get("total_amount", 0) for o in my_orders),
        is_organic_preferred=profile.is_organic_preferred if profile else False,
    )


@router.get("/marketplace", response_model=List[FarmProduceItem])
def browse_marketplace(
    commodity: Optional[str] = None,
    organic_only: Optional[bool] = None,
    current_user: User = Depends(require_role(UserRole.CONSUMER, UserRole.SERVICE_PROVIDER)),
):
    """Browse fresh farm produce available for direct purchase."""
    results = FARM_PRODUCE[:]
    if commodity:
        results = [p for p in results if commodity.lower() in p["commodity"].lower()]
    if organic_only:
        results = [p for p in results if p["is_organic"]]
    return results


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    body: OrderCreate,
    current_user: User = Depends(require_role(UserRole.CONSUMER, UserRole.SERVICE_PROVIDER)),
):
    """Place an order for farm produce."""
    # Find the produce to get pricing
    produce = next((p for p in FARM_PRODUCE if p["id"] == body.produce_id), None)
    if not produce:
        raise HTTPException(status_code=404, detail="Produce listing not found.")

    if body.quantity_kg > produce["available_kg"]:
        raise HTTPException(status_code=400, detail=f"Requested quantity exceeds available stock ({produce['available_kg']} kg).")

    price_per_kg = produce["price_per_kg"]
    total_amount = round(price_per_kg * body.quantity_kg, 2)

    orders = _read_orders()
    order = {
        "id": str(uuid.uuid4()),
        "consumer_id": str(current_user.id),
        "consumer_name": current_user.full_name,
        "produce_id": body.produce_id,
        "commodity": body.commodity,
        "quantity_kg": body.quantity_kg,
        "price_per_kg": price_per_kg,
        "total_amount": total_amount,
        "delivery_address": body.delivery_address,
        "contact_mobile": body.contact_mobile or current_user.mobile,
        "notes": body.notes,
        "status": "placed",
        "created_at": datetime.utcnow().isoformat(),
    }
    orders.append(order)
    _write_orders(orders)
    return order


@router.get("/orders", response_model=List[OrderResponse])
def list_orders(
    current_user: User = Depends(require_role(UserRole.CONSUMER, UserRole.SERVICE_PROVIDER)),
):
    """List all orders placed by this consumer."""
    orders = _read_orders()
    return [o for o in orders if o.get("consumer_id") == str(current_user.id)]


@router.get("/profile")
def get_consumer_profile(
    current_user: User = Depends(require_role(UserRole.CONSUMER, UserRole.SERVICE_PROVIDER)),
    db: Session = Depends(get_db),
):
    """Get consumer profile."""
    profile = db.query(ConsumerProfile).filter(ConsumerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Consumer profile not found.")
    return {
        "id": str(profile.id),
        "user_id": str(profile.user_id),
        "delivery_address": profile.delivery_address,
        "preferred_commodities": profile.preferred_commodities,
        "is_organic_preferred": profile.is_organic_preferred,
        "household_size": profile.household_size,
    }


@router.put("/profile")
def update_consumer_profile(
    updates: ConsumerProfileUpdate,
    current_user: User = Depends(require_role(UserRole.CONSUMER, UserRole.SERVICE_PROVIDER)),
    db: Session = Depends(get_db),
):
    """Update consumer profile."""
    profile = db.query(ConsumerProfile).filter(ConsumerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Consumer profile not found.")

    for field, value in updates.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return {"message": "Consumer profile updated successfully."}
