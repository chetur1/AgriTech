"""
AGRI SMART — Farm Finance & Government Schemes API  (Phase 9)
File: backend/app/api/v1/endpoints/finance.py

Endpoints:
  GET  /expenses              — list farmer's expenses (filterable)
  POST /expenses              — create expense record
  DELETE /expenses/{id}       — delete own expense
  GET  /income                — list farmer's income records
  POST /income                — create income record
  DELETE /income/{id}         — delete own income record
  GET  /summary               — profit/loss summary with breakdowns
  GET  /schemes               — Karnataka + Central govt scheme directory

Design principle:
  Never fabricate scheme application status or approval decisions.
  All scheme data links to official government portals only.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, require_role
from app.database.session import get_db
from app.models.finance import Expense, Income
from app.models.user import User, UserRole

router = APIRouter()

# ---------------------------------------------------------------------------
# Valid enum values (enforced at application layer, not DB layer)
# ---------------------------------------------------------------------------

EXPENSE_CATEGORIES = {
    "Seed", "Fertilizer", "Pesticide", "Labour",
    "Machinery", "Irrigation", "Transport", "Other",
}

INCOME_SOURCES = {"Crop Sale", "Government Subsidy", "Other"}

# ---------------------------------------------------------------------------
# Karnataka + Central Government Scheme Reference Data
# Source: Official government portals — static reference, never fabricated
# ---------------------------------------------------------------------------

SCHEMES = [
    {
        "name": "PM-KISAN",
        "full_name": "Pradhan Mantri Kisan Samman Nidhi",
        "benefit": "₹6,000/year direct income support in 3 installments",
        "eligibility": "Small and marginal farmers with cultivable land",
        "how_to_apply": "Apply at nearest Common Service Centre (CSC) or pmkisan.gov.in",
        "official_link": "https://pmkisan.gov.in",
        "category": "Income Support",
    },
    {
        "name": "PMFBY",
        "full_name": "Pradhan Mantri Fasal Bima Yojana",
        "benefit": "Crop insurance at subsidized premium (1.5-2% Kharif, 2.5% Rabi)",
        "eligibility": "All farmers growing notified crops",
        "how_to_apply": "Apply through banks, insurance companies, or CSC before cut-off date",
        "official_link": "https://pmfby.gov.in",
        "category": "Crop Insurance",
    },
    {
        "name": "RKVY",
        "full_name": "Rashtriya Krishi Vikas Yojana",
        "benefit": "Subsidies on equipment, horticulture, and farm mechanization",
        "eligibility": "Individual farmers and farmer groups registered in Karnataka",
        "how_to_apply": "Apply through District Agriculture Officer (DAO)",
        "official_link": "https://rkvy.nic.in",
        "category": "Farm Infrastructure",
    },
    {
        "name": "KCC",
        "full_name": "Kisan Credit Card",
        "benefit": "Short-term crop loan up to ₹3 lakh at 7% interest rate",
        "eligibility": "All farmers, sharecroppers, and tenant farmers",
        "how_to_apply": "Apply at any nationalized bank or cooperative bank with land records",
        "official_link": "https://www.nabard.org",
        "category": "Credit & Loans",
    },
    {
        "name": "Soil Health Card",
        "full_name": "Soil Health Card Scheme",
        "benefit": "Free soil testing and crop-specific fertilizer recommendations",
        "eligibility": "All farmers - completely free of charge",
        "how_to_apply": "Contact nearest Krishi Vigyan Kendra (KVK) or Agriculture Department office",
        "official_link": "https://soilhealth.dac.gov.in",
        "category": "Soil Health",
    },
    {
        "name": "SMAM",
        "full_name": "Sub-Mission on Agricultural Mechanization",
        "benefit": "50-80% subsidy on farm machinery including tractors, tillers, harvesters",
        "eligibility": "SC/ST/Women farmers get higher subsidy. Apply early as annual quota is limited",
        "how_to_apply": "Apply online at agrimachinery.nic.in or District Agriculture Office",
        "official_link": "https://agrimachinery.nic.in",
        "category": "Farm Mechanization",
    },
    {
        "name": "NHM",
        "full_name": "National Horticulture Mission",
        "benefit": "50-100% subsidy on horticulture seedlings, drip irrigation, greenhouses",
        "eligibility": "Farmers cultivating fruits, vegetables, spices, and flowers",
        "how_to_apply": "Apply through State Horticulture Mission office in your district",
        "official_link": "https://nhm.nic.in",
        "category": "Horticulture",
    },
    {
        "name": "WDPSN",
        "full_name": "Watershed Development Programme",
        "benefit": "Funds for farm ponds, check dams, soil conservation, contour bunding",
        "eligibility": "Farmers in notified watersheds and drought-prone districts",
        "how_to_apply": "Contact Watershed Development Department, Government of Karnataka",
        "official_link": "https://www.karnataka.gov.in",
        "category": "Water Conservation",
    },
]

# ---------------------------------------------------------------------------
# Pydantic Schemas (inline — no separate schemas file needed for finance)
# ---------------------------------------------------------------------------


class ExpenseCreate(BaseModel):
    category: str = Field(
        ...,
        description="Seed | Fertilizer | Pesticide | Labour | Machinery | Irrigation | Transport | Other",
    )
    amount: float = Field(..., gt=0, description="Amount in Indian Rupees (₹)")
    description: Optional[str] = Field(None, max_length=500)
    expense_date: datetime
    season: Optional[str] = Field(None, max_length=50, description="e.g. 'Kharif 2026'")
    farm_id: Optional[uuid.UUID] = None
    crop_id: Optional[uuid.UUID] = None


class ExpenseResponse(BaseModel):
    id: uuid.UUID
    farmer_id: uuid.UUID
    category: str
    amount: float
    description: Optional[str]
    expense_date: datetime
    season: Optional[str]
    farm_id: Optional[uuid.UUID]
    crop_id: Optional[uuid.UUID]
    created_at: datetime

    model_config = {"from_attributes": True}


class IncomeCreate(BaseModel):
    source: str = Field(
        ...,
        description="Crop Sale | Government Subsidy | Other",
    )
    amount: float = Field(..., gt=0, description="Amount in Indian Rupees (₹)")
    commodity: Optional[str] = Field(None, max_length=100, description="Crop or commodity name")
    quantity_quintal: Optional[float] = Field(None, ge=0)
    selling_price_per_quintal: Optional[float] = Field(None, ge=0)
    buyer_name: Optional[str] = Field(None, max_length=200)
    market_name: Optional[str] = Field(None, max_length=200)
    income_date: datetime
    season: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    farm_id: Optional[uuid.UUID] = None
    crop_id: Optional[uuid.UUID] = None


class IncomeResponse(BaseModel):
    id: uuid.UUID
    farmer_id: uuid.UUID
    source: str
    amount: float
    commodity: Optional[str]
    quantity_quintal: Optional[float]
    selling_price_per_quintal: Optional[float]
    buyer_name: Optional[str]
    market_name: Optional[str]
    income_date: datetime
    season: Optional[str]
    description: Optional[str]
    farm_id: Optional[uuid.UUID]
    crop_id: Optional[uuid.UUID]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Expense Endpoints
# ---------------------------------------------------------------------------


@router.get("/expenses", response_model=List[ExpenseResponse])
def list_expenses(
    season: Optional[str] = Query(None, description="Filter by season, e.g. 'Kharif 2026'"),
    category: Optional[str] = Query(None, description="Filter by category"),
    farm_id: Optional[uuid.UUID] = Query(None, description="Filter by farm UUID"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_role(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> List[ExpenseResponse]:
    """
    List the authenticated farmer's expense records.
    Supports filtering by season, category, and farm.
    """
    q = db.query(Expense).filter(Expense.farmer_id == current_user.id)

    if season:
        q = q.filter(Expense.season == season)
    if category:
        q = q.filter(Expense.category == category)
    if farm_id:
        q = q.filter(Expense.farm_id == farm_id)

    return q.order_by(Expense.expense_date.desc()).offset(offset).limit(limit).all()


@router.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    current_user: User = Depends(require_role(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> ExpenseResponse:
    """
    Record a new farming expense for the authenticated farmer.
    """
    if payload.category not in EXPENSE_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid category '{payload.category}'. "
                   f"Allowed values: {sorted(EXPENSE_CATEGORIES)}",
        )

    expense = Expense(
        farmer_id=current_user.id,
        farm_id=payload.farm_id,
        crop_id=payload.crop_id,
        category=payload.category,
        amount=payload.amount,
        description=payload.description,
        expense_date=payload.expense_date,
        season=payload.season,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> None:
    """
    Delete an expense record. Farmers can only delete their own records.
    """
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.farmer_id == current_user.id)
        .first()
    )
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense record not found or you do not have permission to delete it.",
        )
    db.delete(expense)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Income Endpoints
# ---------------------------------------------------------------------------


@router.get("/income", response_model=List[IncomeResponse])
def list_income(
    season: Optional[str] = Query(None, description="Filter by season"),
    source: Optional[str] = Query(None, description="Filter by income source"),
    farm_id: Optional[uuid.UUID] = Query(None, description="Filter by farm UUID"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_role(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> List[IncomeResponse]:
    """
    List the authenticated farmer's income records.
    Supports filtering by season, source, and farm.
    """
    q = db.query(Income).filter(Income.farmer_id == current_user.id)

    if season:
        q = q.filter(Income.season == season)
    if source:
        q = q.filter(Income.source == source)
    if farm_id:
        q = q.filter(Income.farm_id == farm_id)

    return q.order_by(Income.income_date.desc()).offset(offset).limit(limit).all()


@router.post("/income", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income(
    payload: IncomeCreate,
    current_user: User = Depends(require_role(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> IncomeResponse:
    """
    Record a new income event for the authenticated farmer.
    """
    if payload.source not in INCOME_SOURCES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid source '{payload.source}'. "
                   f"Allowed values: {sorted(INCOME_SOURCES)}",
        )

    income = Income(
        farmer_id=current_user.id,
        farm_id=payload.farm_id,
        crop_id=payload.crop_id,
        source=payload.source,
        amount=payload.amount,
        commodity=payload.commodity,
        quantity_quintal=payload.quantity_quintal,
        selling_price_per_quintal=payload.selling_price_per_quintal,
        buyer_name=payload.buyer_name,
        market_name=payload.market_name,
        income_date=payload.income_date,
        season=payload.season,
        description=payload.description,
    )
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


@router.delete("/income/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income(
    income_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> None:
    """
    Delete an income record. Farmers can only delete their own records.
    """
    income = (
        db.query(Income)
        .filter(Income.id == income_id, Income.farmer_id == current_user.id)
        .first()
    )
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income record not found or you do not have permission to delete it.",
        )
    db.delete(income)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Financial Summary Endpoint
# ---------------------------------------------------------------------------


@router.get("/summary")
def get_financial_summary(
    season: Optional[str] = Query(None, description="Filter by season, e.g. 'Kharif 2026'"),
    current_user: User = Depends(require_role(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> dict:
    """
    Returns a comprehensive profit/loss summary for the authenticated farmer:
      - total_expenses: sum of all expenses (optionally filtered by season)
      - total_income: sum of all income records
      - net_profit: total_income - total_expenses
      - expense_by_category: per-category breakdown
      - income_by_source: per-source breakdown
      - season: the season filter applied (or "All Seasons")
      - months_covered: distinct calendar months across all records
    """
    exp_q = db.query(Expense).filter(Expense.farmer_id == current_user.id)
    inc_q = db.query(Income).filter(Income.farmer_id == current_user.id)

    if season:
        exp_q = exp_q.filter(Expense.season == season)
        inc_q = inc_q.filter(Income.season == season)

    expenses: list[Expense] = exp_q.all()
    incomes: list[Income] = inc_q.all()

    total_expenses = sum(e.amount for e in expenses)
    total_income = sum(i.amount for i in incomes)
    net_profit = total_income - total_expenses

    # Per-category expense breakdown
    expense_by_category: dict[str, float] = {}
    for e in expenses:
        expense_by_category[e.category] = (
            expense_by_category.get(e.category, 0.0) + e.amount
        )

    # Per-source income breakdown
    income_by_source: dict[str, float] = {}
    for i in incomes:
        income_by_source[i.source] = (
            income_by_source.get(i.source, 0.0) + i.amount
        )

    # Distinct YYYY-MM months across all financial records
    all_dates: list[datetime] = (
        [e.expense_date for e in expenses] + [i.income_date for i in incomes]
    )
    months_covered = sorted(
        {f"{d.year}-{d.month:02d}" for d in all_dates if d}
    )

    return {
        "total_expenses": round(total_expenses, 2),
        "total_income": round(total_income, 2),
        "net_profit": round(net_profit, 2),
        "is_profitable": net_profit >= 0,
        "expense_by_category": {
            k: round(v, 2) for k, v in sorted(expense_by_category.items())
        },
        "income_by_source": {
            k: round(v, 2) for k, v in sorted(income_by_source.items())
        },
        "season": season or "All Seasons",
        "months_covered": months_covered,
    }


# ---------------------------------------------------------------------------
# Government Schemes Directory
# ---------------------------------------------------------------------------


@router.get("/schemes")
def get_government_schemes(
    category: Optional[str] = Query(
        None,
        description=(
            "Filter by category: Income Support | Crop Insurance | Farm Infrastructure | "
            "Credit & Loans | Soil Health | Farm Mechanization | Horticulture | Water Conservation"
        ),
    ),
    current_user: User = Depends(require_role(UserRole.FARMER)),
) -> dict:
    """
    Returns Karnataka & Central Government agricultural scheme reference data.

    ⚠ IMPORTANT: This endpoint returns STATIC reference information only.
    AGRI SMART cannot confirm scheme eligibility, approval, or application status.
    Always verify at the official government portal or with your District
    Agriculture Officer (DAO) before applying.
    """
    filtered = SCHEMES
    if category:
        filtered = [s for s in SCHEMES if s["category"].lower() == category.strip().lower()]

    return {
        "total": len(filtered),
        "schemes": filtered,
        "disclaimer": (
            "Scheme information is sourced from official government portals. "
            "Eligibility criteria and benefit amounts may change. "
            "AGRI SMART cannot confirm or process scheme applications. "
            "Always verify with your District Agriculture Officer (DAO) before applying."
        ),
        "last_reviewed": "November 2026",
    }
