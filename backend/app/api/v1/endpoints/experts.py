"""
AGRI SMART — Expert Portal Endpoints  (Phase 7)
File: backend/app/api/v1/endpoints/experts.py

Endpoints for verified agricultural experts to:
- View their dashboard statistics
- Review AI-generated crop diagnoses (approve / correct / reject)
- Manage assigned farmers
- Access full expert profile
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_active_user, require_role, require_verified_expert
from app.database.session import get_db
from app.models.ai_diagnosis import AIDiagnosis
from app.models.user import ExpertProfile, User, UserRole, VerificationStatus
from app.schemas.user import ExpertProfileResponse

router = APIRouter()


# ---------------------------------------------------------------------------
# Schema definitions (Phase 7 — inline for clarity)
# ---------------------------------------------------------------------------

class ExpertDashboardStats(BaseModel):
    total_pending_reviews: int
    total_verified_this_month: int
    total_assigned_farmers: int
    total_diagnoses_reviewed_all_time: int
    expert_name: str
    specialisation: str
    institution: str
    verification_status: str
    recent_pending: list = []


class DiagnosisListItem(BaseModel):
    id: str
    crop_name: str
    predicted_disease: str
    confidence_score: float
    severity: str
    status: str
    farmer_name: str
    farmer_district: Optional[str]
    image_url: str
    created_at: str
    is_expert_verified: bool

    class Config:
        from_attributes = True


class DiagnosisDetail(BaseModel):
    id: str
    crop_name: str
    predicted_disease: str
    vernacular_name: str
    confidence_score: float
    severity: str
    status: str
    is_healthy: bool
    symptoms: list
    possible_causes: list
    safe_treatment_organic: list
    chemical_treatment: list
    prevention: list
    image_url: str
    is_expert_verified: bool
    expert_notes: Optional[str]
    expert_diagnosis_override: Optional[str]
    farmer_name: str
    farmer_mobile: str
    farmer_district: Optional[str]
    farmer_state: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class ExpertReviewRequest(BaseModel):
    action: str = Field(
        ...,
        description="approve | correct | reject",
    )
    corrected_disease: Optional[str] = Field(
        None,
        max_length=150,
        description="Required when action='correct'. The verified disease name.",
    )
    expert_notes: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="Mandatory professional clinical observations.",
    )
    severity_override: Optional[str] = Field(
        None,
        description="Optional override: Mild | Moderate | Severe",
    )


class ExpertReviewResponse(BaseModel):
    id: str
    status: str
    is_expert_verified: bool
    expert_notes: str
    expert_diagnosis_override: Optional[str]
    message: str


class FarmerSummary(BaseModel):
    farmer_id: str
    farmer_name: str
    mobile: str
    district: Optional[str]
    state: Optional[str]
    total_diagnoses: int
    pending_diagnoses: int
    last_submission: Optional[str]


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _fmt_dt(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    return dt.isoformat()


# ---------------------------------------------------------------------------
# 1. Expert Dashboard Statistics
# ---------------------------------------------------------------------------

@router.get("/dashboard", response_model=ExpertDashboardStats)
def get_expert_dashboard(
    current_expert: User = Depends(require_verified_expert),
    db: Session = Depends(get_db),
):
    """
    Returns the expert's dashboard statistics.
    Only accessible to admin-verified experts.
    """
    profile: ExpertProfile = current_expert.expert_profile

    total_pending: int = (
        db.query(func.count(AIDiagnosis.id))
        .filter(
            AIDiagnosis.status.in_(["predicted", "pending_expert_review"]),
            AIDiagnosis.is_expert_verified == False,
        )
        .scalar() or 0
    )

    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    verified_month: int = (
        db.query(func.count(AIDiagnosis.id))
        .filter(
            AIDiagnosis.verified_by_id == current_expert.id,
            AIDiagnosis.updated_at >= start_of_month,
        )
        .scalar() or 0
    )

    total_reviewed: int = (
        db.query(func.count(AIDiagnosis.id))
        .filter(AIDiagnosis.verified_by_id == current_expert.id)
        .scalar() or 0
    )

    distinct_farmers: int = (
        db.query(func.count(func.distinct(AIDiagnosis.farmer_id)))
        .scalar() or 0
    )

    pending_diags = (
        db.query(AIDiagnosis)
        .options(joinedload(AIDiagnosis.farmer))
        .filter(
            AIDiagnosis.status.in_(["predicted", "pending_expert_review"]),
            AIDiagnosis.is_expert_verified == False,
        )
        .order_by(AIDiagnosis.created_at.desc())
        .limit(5)
        .all()
    )

    recent = []
    for d in pending_diags:
        recent.append({
            "id": str(d.id),
            "crop_name": d.crop_name,
            "predicted_disease": d.predicted_disease,
            "confidence_score": round(d.confidence_score, 2),
            "severity": d.severity,
            "image_url": d.image_url,
            "farmer_name": d.farmer.full_name if d.farmer else "Unknown",
            "farmer_district": d.farmer.district if d.farmer else None,
            "created_at": _fmt_dt(d.created_at),
        })

    return ExpertDashboardStats(
        total_pending_reviews=total_pending,
        total_verified_this_month=verified_month,
        total_assigned_farmers=distinct_farmers,
        total_diagnoses_reviewed_all_time=total_reviewed,
        expert_name=current_expert.full_name,
        specialisation=profile.specialisation,
        institution=profile.institution,
        verification_status=profile.verification_status.value,
        recent_pending=recent,
    )


# ---------------------------------------------------------------------------
# 2. List AI diagnoses pending expert review
# ---------------------------------------------------------------------------

@router.get("/pending-diagnoses", response_model=List[DiagnosisListItem])
def list_pending_diagnoses(
    crop: Optional[str] = Query(None, description="Filter by crop name"),
    severity: Optional[str] = Query(None, description="Mild | Moderate | Severe"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    current_expert: User = Depends(require_verified_expert),
    db: Session = Depends(get_db),
):
    """All AI diagnoses awaiting expert review."""
    q = (
        db.query(AIDiagnosis)
        .options(joinedload(AIDiagnosis.farmer))
        .filter(
            AIDiagnosis.status.in_(["predicted", "pending_expert_review"]),
            AIDiagnosis.is_expert_verified == False,
        )
    )
    if crop:
        q = q.filter(AIDiagnosis.crop_name.ilike(f"%{crop}%"))
    if severity:
        q = q.filter(AIDiagnosis.severity == severity)

    records = q.order_by(AIDiagnosis.created_at.desc()).offset(offset).limit(limit).all()

    result = []
    for d in records:
        result.append(DiagnosisListItem(
            id=str(d.id),
            crop_name=d.crop_name,
            predicted_disease=d.predicted_disease,
            confidence_score=round(d.confidence_score, 2),
            severity=d.severity,
            status=d.status,
            farmer_name=d.farmer.full_name if d.farmer else "Unknown",
            farmer_district=d.farmer.district if d.farmer else None,
            image_url=d.image_url,
            created_at=_fmt_dt(d.created_at),
            is_expert_verified=d.is_expert_verified,
        ))
    return result


# ---------------------------------------------------------------------------
# 3. Get a single diagnosis in full detail
# ---------------------------------------------------------------------------

@router.get("/diagnoses/{diagnosis_id}", response_model=DiagnosisDetail)
def get_diagnosis_detail(
    diagnosis_id: uuid.UUID = Path(...),
    current_expert: User = Depends(require_verified_expert),
    db: Session = Depends(get_db),
):
    """Full detail view of a single AI diagnosis including farmer contact info."""
    d = (
        db.query(AIDiagnosis)
        .options(joinedload(AIDiagnosis.farmer))
        .filter(AIDiagnosis.id == diagnosis_id)
        .first()
    )
    if not d:
        raise HTTPException(status_code=404, detail="Diagnosis record not found.")

    farmer: User = d.farmer
    return DiagnosisDetail(
        id=str(d.id),
        crop_name=d.crop_name,
        predicted_disease=d.predicted_disease,
        vernacular_name=d.vernacular_name,
        confidence_score=round(d.confidence_score, 2),
        severity=d.severity,
        status=d.status,
        is_healthy=d.is_healthy,
        symptoms=d.symptoms or [],
        possible_causes=d.possible_causes or [],
        safe_treatment_organic=d.safe_treatment_organic or [],
        chemical_treatment=d.chemical_treatment or [],
        prevention=d.prevention or [],
        image_url=d.image_url,
        is_expert_verified=d.is_expert_verified,
        expert_notes=d.expert_notes,
        expert_diagnosis_override=d.expert_diagnosis_override,
        farmer_name=farmer.full_name if farmer else "Unknown",
        farmer_mobile=farmer.mobile if farmer else "N/A",
        farmer_district=farmer.district if farmer else None,
        farmer_state=farmer.state if farmer else None,
        created_at=_fmt_dt(d.created_at),
        updated_at=_fmt_dt(d.updated_at),
    )


# ---------------------------------------------------------------------------
# 4. Submit expert review (approve / correct / reject)
# ---------------------------------------------------------------------------

@router.post("/diagnoses/{diagnosis_id}/review", response_model=ExpertReviewResponse)
def submit_expert_review(
    body: ExpertReviewRequest,
    diagnosis_id: uuid.UUID = Path(...),
    current_expert: User = Depends(require_verified_expert),
    db: Session = Depends(get_db),
):
    """
    Expert submits a professional review of an AI-generated diagnosis.

    Business rules:
    - Only verified (admin-approved) experts may call this endpoint.
    - 'expert_notes' is mandatory (min 10 chars).
    - 'corrected_disease' is mandatory when action='correct'.
    - Re-reviewing an already-verified diagnosis is permitted.
    """
    if body.action not in ("approve", "correct", "reject"):
        raise HTTPException(
            status_code=422,
            detail="action must be one of: approve, correct, reject",
        )
    if body.action == "correct" and not body.corrected_disease:
        raise HTTPException(
            status_code=422,
            detail="'corrected_disease' is required when action is 'correct'.",
        )

    d = db.query(AIDiagnosis).filter(AIDiagnosis.id == diagnosis_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Diagnosis record not found.")

    d.is_expert_verified = True
    d.verified_by_id = current_expert.id
    d.expert_notes = body.expert_notes

    if body.action == "approve":
        d.status = "expert_approved"
        d.expert_diagnosis_override = None
        message = "AI diagnosis approved. Farmer will be notified of expert confirmation."
    elif body.action == "correct":
        d.status = "expert_corrected"
        d.expert_diagnosis_override = body.corrected_disease
        message = f"Diagnosis corrected to '{body.corrected_disease}'. Farmer will see the expert-verified result."
    else:  # reject
        d.status = "expert_rejected"
        d.expert_diagnosis_override = None
        message = "Diagnosis rejected. Farmer advised to submit clearer photographs."

    if body.severity_override and body.severity_override in ("Mild", "Moderate", "Severe"):
        d.severity = body.severity_override

    db.commit()
    db.refresh(d)

    return ExpertReviewResponse(
        id=str(d.id),
        status=d.status,
        is_expert_verified=d.is_expert_verified,
        expert_notes=d.expert_notes,
        expert_diagnosis_override=d.expert_diagnosis_override,
        message=message,
    )


# ---------------------------------------------------------------------------
# 5. List all farmers who have submitted diagnoses
# ---------------------------------------------------------------------------

@router.get("/farmers", response_model=List[FarmerSummary])
def list_assigned_farmers(
    current_expert: User = Depends(require_verified_expert),
    db: Session = Depends(get_db),
):
    """All farmers who have submitted AI diagnoses."""
    farmer_ids_q = db.query(AIDiagnosis.farmer_id).distinct().all()
    farmer_ids = [r[0] for r in farmer_ids_q]

    result = []
    for fid in farmer_ids:
        farmer = db.query(User).filter(User.id == fid).first()
        if not farmer:
            continue
        all_diags = db.query(AIDiagnosis).filter(AIDiagnosis.farmer_id == fid).all()
        pending_count = sum(
            1 for d in all_diags
            if d.status in ("predicted", "pending_expert_review") and not d.is_expert_verified
        )
        last_dt = max((d.created_at for d in all_diags), default=None)
        result.append(FarmerSummary(
            farmer_id=str(fid),
            farmer_name=farmer.full_name,
            mobile=farmer.mobile,
            district=farmer.district,
            state=farmer.state,
            total_diagnoses=len(all_diags),
            pending_diagnoses=pending_count,
            last_submission=_fmt_dt(last_dt),
        ))

    return sorted(result, key=lambda x: x.pending_diagnoses, reverse=True)


# ---------------------------------------------------------------------------
# 6. Expert Profile
# ---------------------------------------------------------------------------

@router.get("/profile", response_model=ExpertProfileResponse)
def get_expert_profile(
    current_user: User = Depends(require_role(UserRole.EXPERT)),
    db: Session = Depends(get_db),
):
    """Get the current agricultural expert's credentials and verification status."""
    if not current_user.expert_profile:
        raise HTTPException(status_code=404, detail="Expert profile not found.")
    return ExpertProfileResponse.model_validate(current_user.expert_profile)
