"""
AGRI SMART — Phase 2 Authentication & RBAC Test Suite
File: backend/tests/test_auth_phase2.py
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_login_admin():
    """Test administrator login with seeded credentials."""
    response = client.post(
        "/api/v1/auth/login",
        json={"mobile_or_email": "admin@agrismart.in", "password": "Admin@AgriSmart2024"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"
    assert data["user"]["status"] == "active"


def test_register_farmer():
    """Test farmer registration flow."""
    farmer_data = {
        "full_name": "Ramesh Gowda",
        "mobile": "9876543210",
        "password": "FarmerPassword@123",
        "role": "farmer",
        "preferred_language": "kn",
        "state": "Karnataka",
        "district": "Mandya",
        "village": "Maddur",
        "total_land_acres": 4.5,
        "primary_crops": "Paddy, Sugarcane",
    }
    response = client.post("/api/v1/auth/register", json=farmer_data)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["user"]["role"] == "farmer"
    assert data["user"]["status"] == "active"
    assert data["user"]["farmer_profile"]["total_land_acres"] == 4.5


def test_duplicate_mobile_rejected():
    """Attempting to register with duplicate mobile number must be rejected."""
    duplicate_data = {
        "full_name": "Another Farmer",
        "mobile": "9876543210",  # same as above
        "password": "AnotherPassword@123",
        "role": "farmer",
        "preferred_language": "en",
        "state": "Karnataka",
    }
    response = client.post("/api/v1/auth/register", json=duplicate_data)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_register_expert_pending_verification():
    """Expert registration must start in PENDING_VERIFICATION state."""
    expert_data = {
        "full_name": "Dr. Ananya Rao",
        "mobile": "9123456780",
        "email": "dr.ananya@uasbengaluru.edu",
        "password": "ExpertPassword@123",
        "role": "expert",
        "preferred_language": "en",
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "qualifications": "Ph.D. Plant Pathology",
        "specialisation": "Crop Disease Diagnosis & Integrated Pest Management",
        "institution": "University of Agricultural Sciences, Bengaluru",
        "experience_years": 8,
    }
    response = client.post("/api/v1/auth/register", json=expert_data)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["user"]["role"] == "expert"
    assert data["user"]["status"] == "pending_verification"
    assert data["user"]["expert_profile"]["verification_status"] == "pending"


def test_farmer_login_and_get_profile():
    """Farmer logs in and accesses /auth/me and /farmers/profile."""
    # 1. Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"mobile_or_email": "9876543210", "password": "FarmerPassword@123"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get /auth/me
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["full_name"] == "Ramesh Gowda"

    # 3. Get /farmers/profile
    profile_res = client.get("/api/v1/farmers/profile", headers=headers)
    assert profile_res.status_code == 200
    assert profile_res.json()["total_land_acres"] == 4.5


def test_rbac_farmer_cannot_access_admin_api():
    """Farmer cannot access admin endpoints (403 Forbidden)."""
    login_res = client.post(
        "/api/v1/auth/login",
        json={"mobile_or_email": "9876543210", "password": "FarmerPassword@123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    admin_res = client.get("/api/v1/admin/users", headers=headers)
    assert admin_res.status_code == 403
    assert "Access denied" in admin_res.json()["detail"]


def test_admin_approves_expert():
    """Admin logs in, lists pending experts, and approves Dr. Ananya."""
    # 1. Admin login
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"mobile_or_email": "admin@agrismart.in", "password": "Admin@AgriSmart2024"},
    )
    admin_token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. List pending experts
    pending_res = client.get("/api/v1/admin/experts/pending", headers=headers)
    assert pending_res.status_code == 200
    pending_experts = pending_res.json()
    assert len(pending_experts) >= 1
    expert = next(e for e in pending_experts if e["email"] == "dr.ananya@uasbengaluru.edu")
    expert_id = expert["id"]

    # 3. Approve expert
    verify_res = client.post(
        f"/api/v1/admin/experts/{expert_id}/verify",
        headers=headers,
        json={"status": "approved"},
    )
    assert verify_res.status_code == 200
    verified_data = verify_res.json()
    assert verified_data["status"] == "active"
    assert verified_data["expert_profile"]["verification_status"] == "approved"
