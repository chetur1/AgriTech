"""
AGRI SMART — Administrator Management Endpoints
File: backend/app/api/v1/endpoints/admin.py
"""

from typing import List, Optional
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User, UserRole, UserStatus, ExpertProfile, VerificationStatus, AuditLog
from app.schemas.user import (
    UserResponse,
    ExpertProfileResponse,
    UserStatusUpdateRequest,
    ExpertVerificationRequest,
    AuditLogResponse,
)
from app.api.deps import require_role

router = APIRouter()


@router.get("/users", response_model=List[UserResponse], dependencies=[Depends(require_role(UserRole.ADMIN))])
def list_users(
    role: Optional[UserRole] = None,
    status_filter: Optional[UserStatus] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Admin endpoint to list all platform users with filtering."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if status_filter:
        query = query.filter(User.status == status_filter)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(User.full_name.ilike(search_pattern) | User.mobile.like(search_pattern))

    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/experts/pending", response_model=List[UserResponse], dependencies=[Depends(require_role(UserRole.ADMIN))])
def list_pending_experts(db: Session = Depends(get_db)):
    """List all agricultural experts waiting for credential verification."""
    experts = (
        db.query(User)
        .join(ExpertProfile, User.id == ExpertProfile.user_id)
        .filter(ExpertProfile.verification_status == VerificationStatus.PENDING)
        .all()
    )
    return [UserResponse.model_validate(u) for u in experts]


@router.post("/experts/{expert_user_id}/verify", response_model=UserResponse)
def verify_expert(
    expert_user_id: uuid.UUID,
    payload: ExpertVerificationRequest,
    request: Request,
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """
    Approve or reject an expert's credential application.
    Only approved experts can issue verified recommendations.
    """
    user = db.query(User).filter(User.id == expert_user_id, User.role == UserRole.EXPERT).first()
    if not user or not user.expert_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expert profile not found.")

    profile = user.expert_profile
    profile.verification_status = payload.status
    profile.verified_by_admin_id = current_admin.id
    profile.verified_at = datetime.now(timezone.utc)
    profile.rejection_reason = payload.rejection_reason if payload.status == VerificationStatus.REJECTED else None

    # If approved, set user status to ACTIVE
    if payload.status == VerificationStatus.APPROVED:
        user.status = UserStatus.ACTIVE
    elif payload.status == VerificationStatus.REJECTED:
        user.status = UserStatus.INACTIVE

    # Audit log
    audit = AuditLog(
        user_id=current_admin.id,
        action="EXPERT_VERIFICATION",
        resource_type="expert_profiles",
        resource_id=str(profile.id),
        details=f"Admin {current_admin.full_name} set expert status to {payload.status.value}",
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: uuid.UUID,
    payload: UserStatusUpdateRequest,
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Admin endpoint to suspend or activate any user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.id == current_admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admins cannot change their own status.")

    user.status = payload.status
    if payload.status == UserStatus.SUSPENDED:
        user.is_active = False
    elif payload.status == UserStatus.ACTIVE:
        user.is_active = True

    audit = AuditLog(
        user_id=current_admin.id,
        action="USER_STATUS_CHANGE",
        resource_type="users",
        resource_id=str(user.id),
        details=f"Changed status to {payload.status.value}. Reason: {payload.reason or 'None'}",
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)


@router.get("/audit-logs", response_model=List[AuditLogResponse], dependencies=[Depends(require_role(UserRole.ADMIN))])
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Fetch security audit logs."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return [AuditLogResponse.model_validate(l) for l in logs]
