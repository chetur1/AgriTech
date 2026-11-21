"""
AGRI SMART — Health Endpoint
File: backend/app/api/v1/endpoints/health.py

A simple endpoint used to verify the backend is running.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.session import get_db

router = APIRouter()


@router.get("")
async def api_health(db: Session = Depends(get_db)):
    """
    Health check that verifies database connectivity.
    Returns HTTP 200 when everything is working.
    """
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "api": "AGRI SMART API v1",
        "status": "healthy",
        "database": db_status,
    }
