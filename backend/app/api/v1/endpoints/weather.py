"""
AGRI SMART — Weather API Endpoints
File: backend/app/api/v1/endpoints/weather.py
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.farm import Farm
from app.services.weather_service import WeatherService, KARNATAKA_COORDS

router = APIRouter()


@router.get("/current")
async def get_current_weather(
    lat: Optional[float] = Query(None, ge=-90, le=90),
    lon: Optional[float] = Query(None, ge=-180, le=180),
    district: Optional[str] = Query(None),
):
    """
    Get current weather for specific coordinates or Karnataka district.
    """
    target_lat = lat
    target_lon = lon

    if target_lat is None or target_lon is None:
        dist_key = (district or "mandya").strip().lower()
        coords = KARNATAKA_COORDS.get(dist_key, KARNATAKA_COORDS["mandya"])
        target_lat = coords["lat"]
        target_lon = coords["lon"]

    return await WeatherService.get_forecast(target_lat, target_lon)


@router.get("/forecast")
async def get_weather_forecast(
    lat: Optional[float] = Query(None, ge=-90, le=90),
    lon: Optional[float] = Query(None, ge=-180, le=180),
    district: Optional[str] = Query(None),
):
    """
    Get 7-day agricultural forecast & hourly weather with spraying and irrigation advisories.
    """
    target_lat = lat
    target_lon = lon

    if target_lat is None or target_lon is None:
        dist_key = (district or "mandya").strip().lower()
        coords = KARNATAKA_COORDS.get(dist_key, KARNATAKA_COORDS["mandya"])
        target_lat = coords["lat"]
        target_lon = coords["lon"]

    return await WeatherService.get_forecast(target_lat, target_lon)


@router.get("/farm/{farm_id}")
async def get_farm_weather(
    farm_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get hyper-local weather tailored to a registered farm parcel.
    Uses farm's recorded GPS coordinates or district defaults.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    if farm.latitude and farm.longitude:
        target_lat = farm.latitude
        target_lon = farm.longitude
    else:
        dist_key = (farm.district or "mandya").strip().lower()
        coords = KARNATAKA_COORDS.get(dist_key, KARNATAKA_COORDS["mandya"])
        target_lat = coords["lat"]
        target_lon = coords["lon"]

    weather_data = await WeatherService.get_forecast(target_lat, target_lon)
    weather_data["farm_name"] = farm.name
    weather_data["farm_district"] = farm.district
    return weather_data
