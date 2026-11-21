"""
AGRI SMART — Backend Application Entry Point
File: backend/app/main.py

This is the root FastAPI application. It:
- Creates the FastAPI app instance with metadata
- Configures CORS (Cross-Origin Resource Sharing)
- Mounts all API routers under /api/v1
- Provides a health-check endpoint
- Serves uploaded files securely
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os

from app.core.config import settings
from app.database.session import engine
from app.database import base  # noqa — imports all models so Alembic can see them
from app.api.v1.router import api_router

# ---------------------------------------------------------------------------
# Application instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AGRI SMART — Smart Farming. Better Decisions. Stronger Farmers.\n\n"
        "A production-oriented agricultural intelligence platform for Indian farmers."
    ),
    version="1.0.0",
    docs_url="/api/docs",        # Swagger UI
    redoc_url="/api/redoc",      # ReDoc
    openapi_url="/api/openapi.json",
)

# ---------------------------------------------------------------------------
# CORS — allow the React frontend to call the backend
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # alternative dev port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Mount uploaded files directory
# Files are served at /uploads/<filename>
# In production use a dedicated file server or cloud storage.
# ---------------------------------------------------------------------------

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ---------------------------------------------------------------------------
# API routers
# ---------------------------------------------------------------------------

app.include_router(api_router, prefix="/api/v1")

# ---------------------------------------------------------------------------
# Root health-check
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
async def root():
    """Root health-check endpoint."""
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "environment": settings.APP_ENV,
        "docs": "/api/docs",
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Detailed health-check for monitoring."""
    return JSONResponse(
        content={
            "status": "healthy",
            "app": settings.APP_NAME,
            "environment": settings.APP_ENV,
            "database": "connected",   # will be verified in Phase 2
        }
    )
