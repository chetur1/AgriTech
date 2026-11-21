"""
AGRI SMART — Agmarknet Market Price API Endpoints  (Phase 8)
File: backend/app/api/v1/endpoints/market.py

Provides live agricultural commodity prices from AGMARKNET via data.gov.in.
Principle 8: Never fabricate prices. Always show data source and timestamp.
"""

from typing import Optional
from fastapi import APIRouter, Query

from app.services.market_service import (
    fetch_mandi_prices,
    get_karnataka_commodities,
    get_markets_by_district,
)

router = APIRouter()


@router.get("/prices")
async def get_mandi_prices(
    commodity: str = Query(..., description="e.g. Ragi, Paddy, Tomato"),
    state: str = Query("Karnataka", description="State name (default: Karnataka)"),
    district: Optional[str] = Query(None, description="Optional district filter"),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Fetch live mandi prices for a commodity from AGMARKNET (data.gov.in).

    - Returns live prices when available.
    - Returns status='unavailable' with an informative message if the API
      is offline or no data exists for the query. Prices are NEVER fabricated.
    - Always includes: source, commodity, fetched_at, and market attribution.
    """
    return await fetch_mandi_prices(
        commodity=commodity,
        state=state,
        district=district,
        limit=limit,
    )


@router.get("/commodities")
def get_commodities():
    """List of agricultural commodities supported for Karnataka price lookup."""
    return get_karnataka_commodities()


@router.get("/markets")
def get_markets(
    district: Optional[str] = Query(None, description="Karnataka district name"),
):
    """List of Karnataka APMC markets, optionally filtered by district."""
    return get_markets_by_district(district=district)
