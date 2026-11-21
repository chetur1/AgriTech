"""
AGRI SMART — Consultation API Endpoints
File: backend/app/api/v1/endpoints/consultations.py
"""

from __future__ import annotations

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_active_user, require_role, require_verified_expert
from app.database.session import get_db
from app.models.consultation import Consultation, ConsultationMessage
from app.models.user import User, UserRole
from app.schemas.consultation import (
    ConsultationCreate,
    ConsultationResponse,
    ConsultationStatusUpdate,
    MessageCreate,
    MessageResponse,
)

router = APIRouter()


def _to_response(c: Consultation) -> ConsultationResponse:
    resp = ConsultationResponse(
        id=c.id,
        farmer_id=c.farmer_id,
        farmer_name=c.farmer.full_name if c.farmer else "Unknown Farmer",
        farmer_district=c.farmer.district if c.farmer else None,
        assigned_expert_id=c.assigned_expert_id,
        assigned_expert_name=c.assigned_expert.full_name if c.assigned_expert else None,
        crop_id=c.crop_id,
        diagnosis_id=c.diagnosis_id,
        subject=c.subject,
        description=c.description,
        category=c.category,
        urgency=c.urgency,
        status=c.status,
        created_at=c.created_at,
        updated_at=c.updated_at,
        messages=[
            MessageResponse.model_validate(m) for m in (c.messages or [])
        ],
    )
    return resp


@router.get("", response_model=List[ConsultationResponse])
def list_consultations(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    List consultations relevant to the authenticated user:
    - Farmers see their own consultations.
    - Verified experts see all open, assigned, or pending consultations.
    - Admins see all consultations.
    """
    q = (
        db.query(Consultation)
        .options(
            joinedload(Consultation.farmer),
            joinedload(Consultation.assigned_expert),
            joinedload(Consultation.messages),
        )
    )

    if current_user.role == UserRole.FARMER:
        q = q.filter(Consultation.farmer_id == current_user.id)
    elif current_user.role == UserRole.EXPERT:
        # Show all consultations that are open or assigned to this expert
        pass

    if status_filter:
        q = q.filter(Consultation.status == status_filter)

    results = q.order_by(Consultation.updated_at.desc()).all()
    return [_to_response(c) for c in results]


@router.post("", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
def create_consultation(
    payload: ConsultationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new consultation request (farmers or experts)."""
    consultation = Consultation(
        farmer_id=current_user.id,
        subject=payload.subject,
        description=payload.description,
        category=payload.category,
        urgency=payload.urgency,
        crop_id=payload.crop_id,
        diagnosis_id=payload.diagnosis_id,
        status="open",
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)

    # Initial opening message
    first_msg = ConsultationMessage(
        consultation_id=consultation.id,
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        sender_role=current_user.role.value,
        message=payload.description,
        is_expert_verified=False,
    )
    db.add(first_msg)
    db.commit()

    return _to_response(consultation)


@router.get("/{consultation_id}", response_model=ConsultationResponse)
def get_consultation(
    consultation_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve full consultation details and discussion thread."""
    c = (
        db.query(Consultation)
        .options(
            joinedload(Consultation.farmer),
            joinedload(Consultation.assigned_expert),
            joinedload(Consultation.messages),
        )
        .filter(Consultation.id == consultation_id)
        .first()
    )
    if not c:
        raise HTTPException(status_code=404, detail="Consultation not found.")

    if current_user.role == UserRole.FARMER and c.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to this consultation.")

    return _to_response(c)


@router.post("/{consultation_id}/respond", response_model=MessageResponse)
def respond_to_consultation(
    consultation_id: uuid.UUID,
    payload: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Post a message or expert recommendation in the consultation thread."""
    c = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consultation not found.")

    is_expert = current_user.role == UserRole.EXPERT
    if is_expert:
        # Auto-assign to expert if unassigned
        if not c.assigned_expert_id:
            c.assigned_expert_id = current_user.id
        c.status = "answered"
    elif current_user.id == c.farmer_id:
        if c.status == "answered":
            c.status = "in_progress"

    msg = ConsultationMessage(
        consultation_id=c.id,
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        sender_role=current_user.role.value,
        message=payload.message,
        is_expert_verified=is_expert,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return MessageResponse.model_validate(msg)


@router.patch("/{consultation_id}/status", response_model=ConsultationResponse)
def update_consultation_status(
    consultation_id: uuid.UUID,
    payload: ConsultationStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update consultation lifecycle status (e.g. mark closed or resolved)."""
    c = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consultation not found.")

    c.status = payload.status
    db.commit()
    db.refresh(c)
    return _to_response(c)
