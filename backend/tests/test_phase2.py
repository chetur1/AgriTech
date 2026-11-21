"""
AGRI SMART — Phase 2 Test Suite (uses httpx2 + ASGITransport)
File: backend/tests/test_phase2.py

Run with: python -m pytest tests/test_phase2.py -v
"""

import pytest
from httpx2 import AsyncClient, ASGITransport

from app.main import app


@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_root():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/")
        assert res.status_code == 200
        assert res.json()["app"] == "AGRI SMART"


@pytest.mark.anyio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"


@pytest.mark.anyio
async def test_admin_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/v1/auth/login",
            json={"mobile_or_email": "admin@agrismart.in", "password": "Admin@AgriSmart2024"},
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["status"] == "active"


@pytest.mark.anyio
async def test_farmer_register_and_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register
        reg = await client.post("/api/v1/auth/register", json={
            "full_name": "Suresh Kumar",
            "mobile": "9871112222",
            "password": "FarmerTest@123",
            "role": "farmer",
            "preferred_language": "kn",
            "state": "Karnataka",
            "district": "Raichur",
            "village": "Deodurga",
            "total_land_acres": 2.5,
            "primary_crops": "Cotton, Groundnut",
        })
        assert reg.status_code == 201, reg.text
        assert reg.json()["user"]["role"] == "farmer"
        assert reg.json()["user"]["status"] == "active"

        # Login
        login = await client.post("/api/v1/auth/login", json={
            "mobile_or_email": "9871112222",
            "password": "FarmerTest@123",
        })
        assert login.status_code == 200
        token = login.json()["access_token"]

        # /auth/me
        me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        assert me.json()["full_name"] == "Suresh Kumar"

        # /farmers/profile
        profile = await client.get("/api/v1/farmers/profile", headers={"Authorization": f"Bearer {token}"})
        assert profile.status_code == 200
        assert profile.json()["total_land_acres"] == 2.5


@pytest.mark.anyio
async def test_rbac_farmer_blocked_from_admin():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        login = await client.post("/api/v1/auth/login", json={
            "mobile_or_email": "9871112222",
            "password": "FarmerTest@123",
        })
        token = login.json()["access_token"]
        res = await client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 403


@pytest.mark.anyio
async def test_expert_register_pending():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        reg = await client.post("/api/v1/auth/register", json={
            "full_name": "Dr. Priya Sharma",
            "mobile": "9811223344",
            "email": "dr.priya@uasdharwad.edu",
            "password": "ExpertTest@123",
            "role": "expert",
            "preferred_language": "en",
            "state": "Karnataka",
            "district": "Dharwad",
            "qualifications": "M.Sc. Agronomy, Ph.D. Soil Science",
            "specialisation": "Soil Health and Crop Nutrition",
            "institution": "UAS Dharwad",
            "experience_years": 5,
        })
        assert reg.status_code == 201, reg.text
        assert reg.json()["user"]["status"] == "pending_verification"
        assert reg.json()["user"]["expert_profile"]["verification_status"] == "pending"


@pytest.mark.anyio
async def test_admin_approves_expert():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Admin login
        admin_res = await client.post("/api/v1/auth/login", json={
            "mobile_or_email": "admin@agrismart.in",
            "password": "Admin@AgriSmart2024",
        })
        admin_token = admin_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {admin_token}"}

        # Get pending experts
        pending = await client.get("/api/v1/admin/experts/pending", headers=headers)
        assert pending.status_code == 200
        experts = pending.json()
        expert = next((e for e in experts if e["email"] == "dr.priya@uasdharwad.edu"), None)
        assert expert is not None, "Expert not found in pending list"
        expert_id = expert["id"]

        # Approve
        verify = await client.post(
            f"/api/v1/admin/experts/{expert_id}/verify",
            headers=headers,
            json={"status": "approved"},
        )
        assert verify.status_code == 200, verify.text
        assert verify.json()["status"] == "active"
        assert verify.json()["expert_profile"]["verification_status"] == "approved"
