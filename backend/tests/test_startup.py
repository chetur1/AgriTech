"""
AGRI SMART — Backend Startup Test
File: backend/tests/test_startup.py

Run with: pytest tests/test_startup.py -v
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Root / should return 200 with app info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "AGRI SMART"
    assert data["status"] == "running"


def test_health_endpoint():
    """Health endpoint should return 200."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_docs_accessible():
    """Swagger docs should be accessible."""
    response = client.get("/api/docs")
    assert response.status_code == 200


def test_v1_health():
    """API v1 health check (may fail without DB — that is expected in phase 1)."""
    response = client.get("/api/v1/health")
    # 200 = DB connected, 500 = DB not connected yet
    assert response.status_code in (200, 500)
