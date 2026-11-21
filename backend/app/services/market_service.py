"""
AGRI SMART — Agmarknet Market Price Service  (Phase 8)
File: backend/app/services/market_service.py

Integrates with the Government of India's data.gov.in Agmarknet API to fetch
live agricultural commodity prices from APMC mandis.

Design principles applied:
- Core Principle 8: Never fabricate prices. If the API is unreachable or the
  commodity has no data, return a structured "unavailable" response.
- Always show source, commodity, market, unit, and date.
- The sample API key from data.gov.in documentation is used for the free tier.
  Replace with a registered key for production use.

Data source: AGMARKNET via data.gov.in
API endpoint: https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
"""

from __future__ import annotations

import httpx
from typing import Any, Dict, List, Optional
from datetime import datetime

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# data.gov.in public sample key — replace with your registered key in production
# Register free at: https://data.gov.in/user/register
AGMARKNET_API_KEY = "579b464db66ec23bdd000001cdd3946e1ce4474da8b3d8f10efcb"
AGMARKNET_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
AGMARKNET_BASE_URL = "https://api.data.gov.in/resource"
REQUEST_TIMEOUT = 15  # seconds

# ---------------------------------------------------------------------------
# Karnataka commodities and market reference data
# ---------------------------------------------------------------------------

KARNATAKA_COMMODITIES = [
    "Ragi",
    "Paddy",
    "Tomato",
    "Cotton",
    "Maize",
    "Groundnut",
    "Sugarcane",
    "Onion",
    "Potato",
    "Jowar",
    "Wheat",
    "Sunflower",
    "Areca Nut",
    "Coconut",
    "Banana",
]

# Major Karnataka APMCs by district
KARNATAKA_MARKETS = {
    "Bangalore Rural": ["Doddaballapur", "Nelamangala", "Hoskote"],
    "Bangalore Urban": ["Bangalore", "APMC Yeshwanthpur"],
    "Mandya": ["Mandya", "Maddur", "Srirangapatna", "Malavalli"],
    "Mysuru": ["Mysore", "Hunsur", "Periyapatna", "Heggadadevankote"],
    "Tumakuru": ["Tumkur", "Tiptur", "Madhugiri", "Pavagada"],
    "Davangere": ["Davangere", "Harihar", "Channagiri"],
    "Haveri": ["Haveri", "Ranebennur", "Shiggaon"],
    "Dharwad": ["Dharwad", "Hubli", "Kundgol"],
    "Belagavi": ["Belgaum", "Chikkodi", "Gokak"],
    "Vijayapura": ["Bijapur", "Basavana Bagewadi"],
    "Kalaburagi": ["Gulbarga", "Chittapur", "Shorapur"],
    "Raichur": ["Raichur", "Lingsugur", "Manvi"],
    "Chitradurga": ["Chitradurga", "Hiriyur", "Challakere"],
    "Chikkamagaluru": ["Chikmagalur", "Kadur", "Tarikere"],
    "Hassan": ["Hassan", "Channarayapatna", "Belur", "Sakleshpur"],
    "Shivamogga": ["Shimoga", "Sagar", "Bhadravathi"],
    "Uttara Kannada": ["Karwar", "Sirsi"],
    "Kodagu": ["Madikeri", "Virajpet"],
    "Udupi": ["Udupi", "Kundapur"],
    "Dakshina Kannada": ["Mangalore"],
    "Kolar": ["Kolar", "Mulbagal", "Bangarpet"],
    "Chikkaballapur": ["Chikkaballapur", "Gudibanda"],
    "Ramanagara": ["Ramanagara", "Channapatna"],
    "Bidar": ["Bidar", "Basavakalyan", "Aurad"],
    "Koppal": ["Koppal", "Gangavathi", "Kushtagi"],
    "Gadag": ["Gadag", "Nargund"],
    "Bagalkot": ["Bagalkot", "Mudhol", "Jamkhandi"],
    "Yadgir": ["Yadgir", "Shahapur"],
    "Vijayanagara": ["Hosapete", "Kampli"],
    "Ballari": ["Ballari", "Sandur", "Hospet"],
}


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------

async def fetch_mandi_prices(
    commodity: str,
    state: str = "Karnataka",
    district: Optional[str] = None,
    limit: int = 20,
) -> Dict[str, Any]:
    """
    Fetch live mandi prices from AGMARKNET via data.gov.in.

    Returns a structured dict:
    {
        "status": "success" | "unavailable" | "error",
        "source": "AGMARKNET / data.gov.in",
        "commodity": str,
        "state": str,
        "fetched_at": ISO datetime string,
        "records": [ { market, district, state, commodity, variety,
                        min_price, max_price, modal_price, unit, arrival_date } ],
        "message": str    # only present when status != "success"
    }
    """
    params: Dict[str, Any] = {
        "api-key": AGMARKNET_API_KEY,
        "format": "json",
        "limit": limit,
        "filters[State]": state,
        "filters[Commodity]": commodity,
    }
    if district:
        params["filters[District]"] = district

    fetched_at = datetime.utcnow().isoformat() + "Z"

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            resp = await client.get(
                f"{AGMARKNET_BASE_URL}/{AGMARKNET_RESOURCE_ID}",
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()

    except httpx.TimeoutException:
        return _unavailable_response(
            commodity, state, fetched_at,
            "AGMARKNET API timed out. Please try again shortly."
        )
    except httpx.HTTPStatusError as exc:
        return _unavailable_response(
            commodity, state, fetched_at,
            f"AGMARKNET API returned HTTP {exc.response.status_code}. "
            "The government data portal may be temporarily unavailable."
        )
    except Exception as exc:
        return _unavailable_response(
            commodity, state, fetched_at,
            f"Could not connect to AGMARKNET: {str(exc)}"
        )

    # Parse records
    raw_records: list = data.get("records", [])
    if not raw_records:
        return {
            "status": "unavailable",
            "source": "AGMARKNET / data.gov.in",
            "commodity": commodity,
            "state": state,
            "fetched_at": fetched_at,
            "records": [],
            "message": (
                f"No price data found for '{commodity}' in {state}"
                + (f", {district}" if district else "")
                + ". The commodity may not be traded in this region today, "
                "or data may not yet be published for today's market session."
            ),
        }

    parsed = []
    for r in raw_records:
        parsed.append({
            "market":       r.get("Market", ""),
            "district":     r.get("District", ""),
            "state":        r.get("State", ""),
            "commodity":    r.get("Commodity", commodity),
            "variety":      r.get("Variety", ""),
            "min_price":    _safe_float(r.get("Min Price")),
            "max_price":    _safe_float(r.get("Max Price")),
            "modal_price":  _safe_float(r.get("Modal Price")),
            "unit":         "Per Quintal",
            "arrival_date": r.get("Arrival Date", ""),
        })

    return {
        "status": "success",
        "source": "AGMARKNET / data.gov.in",
        "commodity": commodity,
        "state": state,
        "fetched_at": fetched_at,
        "records": parsed,
        "total_markets": len(parsed),
    }


def get_karnataka_commodities() -> Dict[str, Any]:
    """Return the list of commodities supported for Karnataka price lookup."""
    return {
        "state": "Karnataka",
        "commodities": KARNATAKA_COMMODITIES,
        "note": "Commodity names must match AGMARKNET spelling exactly.",
    }


def get_markets_by_district(district: Optional[str] = None) -> Dict[str, Any]:
    """
    Return Karnataka APMC markets. If a district is provided, filter to that district.
    """
    if district:
        # Case-insensitive match
        district_lower = district.lower()
        for key, markets in KARNATAKA_MARKETS.items():
            if key.lower() == district_lower:
                return {
                    "district": key,
                    "state": "Karnataka",
                    "markets": markets,
                }
        return {
            "district": district,
            "state": "Karnataka",
            "markets": [],
            "message": f"No markets listed for district '{district}'. "
                       "Check spelling or consult your local APMC office.",
        }

    return {
        "state": "Karnataka",
        "total_districts": len(KARNATAKA_MARKETS),
        "markets_by_district": KARNATAKA_MARKETS,
    }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _unavailable_response(
    commodity: str, state: str, fetched_at: str, message: str
) -> Dict[str, Any]:
    return {
        "status": "unavailable",
        "source": "AGMARKNET / data.gov.in",
        "commodity": commodity,
        "state": state,
        "fetched_at": fetched_at,
        "records": [],
        "message": message,
    }


def _safe_float(value: Any) -> Optional[float]:
    try:
        return float(value) if value not in (None, "", "N/A") else None
    except (ValueError, TypeError):
        return None
