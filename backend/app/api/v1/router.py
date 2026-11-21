"""
AGRI SMART — API v1 Router
File: backend/app/api/v1/router.py
"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    health, auth, admin, farmers, experts,
    farms, crops, weather, rag, ai_diagnosis
)

api_router = APIRouter()

# Health check
api_router.include_router(health.router, prefix="/health", tags=["Health"])

# Phase 2 Authentication & Role Management
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administrator"])
api_router.include_router(farmers.router, prefix="/farmers", tags=["Farmers"])
api_router.include_router(experts.router, prefix="/experts", tags=["Experts"])

# Phase 3 Farm & Crop Management
api_router.include_router(farms.router, prefix="/farms", tags=["Farms"])
api_router.include_router(crops.router, prefix="/crops", tags=["Crops"])

# Phase 4 Weather & Climate Intelligence
api_router.include_router(weather.router, prefix="/weather", tags=["Weather"])

# Phase 5 Agricultural Knowledge RAG
api_router.include_router(rag.router, prefix="/rag", tags=["Agricultural RAG"])

# Phase 6 AI Crop Disease Detection
api_router.include_router(ai_diagnosis.router, prefix="/ai", tags=["AI Diagnosis"])

# Phase 7 Expert Portal
# (experts router already registered above with prefix="/experts")

# Phase 8 Market Prices (Agmarknet / data.gov.in)
from app.api.v1.endpoints import market
api_router.include_router(market.router, prefix="/market", tags=["Market Prices"])

# Phase 7 & 10 Consultations
from app.api.v1.endpoints import consultations
api_router.include_router(consultations.router, prefix="/consultations", tags=["Consultations"])

# Phase 9 Finance & Government Schemes
from app.api.v1.endpoints import finance
api_router.include_router(finance.router, prefix="/finance", tags=["Finance & Schemes"])

# Phase 10 Community Forum
from app.api.v1.endpoints import community
api_router.include_router(community.router, prefix="/community", tags=["Community Forum"])
