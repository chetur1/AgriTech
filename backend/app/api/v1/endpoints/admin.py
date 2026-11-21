"""
AGRI SMART — Administrator Management Endpoints
File: backend/app/api/v1/endpoints/admin.py
"""

from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc, text

from app.database.session import get_db, engine
from app.models.user import (
    User, UserRole, UserStatus, ExpertProfile, VerificationStatus, AuditLog,
    FarmerProfile
)
from app.models.marketplace import BuyerProfile, ConsumerProfile
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.consultation import Consultation
from app.models.ai_diagnosis import AIDiagnosis
from app.schemas.user import (
    UserResponse,
    ExpertProfileResponse,
    UserStatusUpdateRequest,
    ExpertVerificationRequest,
    AuditLogResponse,
)
from app.api.deps import require_role
from app.core.config import settings

router = APIRouter()


@router.get("/stats", dependencies=[Depends(require_role(UserRole.ADMIN))])
def get_admin_dashboard_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns real-time analytics for the Admin Dashboard.
    """
    # 1. Total users & role breakdown
    total_users = db.query(func.count(User.id)).scalar() or 0

    role_counts = (
        db.query(User.role, func.count(User.id))
        .group_by(User.role)
        .all()
    )
    roles_dict = {str(r.value if hasattr(r, 'value') else r): count for r, count in role_counts}

    # 2. Status breakdown
    status_counts = (
        db.query(User.status, func.count(User.id))
        .group_by(User.status)
        .all()
    )
    status_dict = {str(s.value if hasattr(s, 'value') else s): count for s, count in status_counts}

    # 3. Pending experts
    pending_experts = (
        db.query(func.count(ExpertProfile.id))
        .filter(ExpertProfile.verification_status == VerificationStatus.PENDING)
        .scalar()
        or 0
    )

    # 4. Other key platform metrics
    total_farms = db.query(func.count(Farm.id)).scalar() or 0
    total_crops = db.query(func.count(Crop.id)).scalar() or 0
    total_consultations = db.query(func.count(Consultation.id)).scalar() or 0
    total_diagnoses = db.query(func.count(AIDiagnosis.id)).scalar() or 0
    total_audits = db.query(func.count(AuditLog.id)).scalar() or 0

    # 5. Recent registered users (last 6)
    recent_users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .limit(6)
        .all()
    )

    # 6. Recent audit events (last 6)
    recent_audits = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(6)
        .all()
    )

    return {
        "summary": {
            "total_users": total_users,
            "active_users": status_dict.get("active", 0),
            "pending_verifications": pending_experts,
            "total_farms": total_farms,
            "total_crops": total_crops,
            "total_consultations": total_consultations,
            "total_diagnoses": total_diagnoses,
            "total_audits": total_audits,
        },
        "roles_breakdown": {
            "farmer": roles_dict.get("farmer", 0),
            "expert": roles_dict.get("expert", 0),
            "buyer": roles_dict.get("buyer", 0) + roles_dict.get("broker", 0),
            "consumer": roles_dict.get("consumer", 0) + roles_dict.get("service_provider", 0),
            "admin": roles_dict.get("admin", 0),
        },
        "status_breakdown": status_dict,
        "recent_users": [UserResponse.model_validate(u) for u in recent_users],
        "recent_audits": [AuditLogResponse.model_validate(a) for a in recent_audits],
    }


@router.get("/system-info", dependencies=[Depends(require_role(UserRole.ADMIN))])
def get_system_info(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns database connection, region, realtime publications, and health info."""
    realtime_tables = []
    try:
        with engine.connect() as conn:
            res = conn.execute(
                text("SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime'")
            )
            realtime_tables = [r[0] for r in res.fetchall()]
    except Exception:
        realtime_tables = []

    return {
        "database": {
            "engine": "PostgreSQL 17.12",
            "provider": "Supabase Cloud",
            "project_id": "mbdiqutrnqsqnzegsqgl",
            "region": "ap-northeast-2 (Seoul)",
            "host": settings.DB_HOST,
            "ssl": True,
            "realtime_enabled": len(realtime_tables) > 0,
            "realtime_tables_count": len(realtime_tables),
            "realtime_tables": sorted(realtime_tables),
        },
        "application": {
            "name": settings.APP_NAME,
            "environment": settings.APP_ENV,
            "debug": settings.APP_DEBUG,
            "version": "1.0.0",
            "frontend_url": settings.FRONTEND_URL,
            "weather_provider": settings.WEATHER_PROVIDER,
            "server_time": datetime.now(timezone.utc).isoformat(),
        }
    }


@router.get("/users", response_model=List[UserResponse], dependencies=[Depends(require_role(UserRole.ADMIN))])
def list_users(
    role: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Admin endpoint to list all platform users with filtering."""
    query = db.query(User)
    if role and role != "all":
        # Handle buyer/broker alias
        if role in ("buyer", "broker"):
            query = query.filter(or_(User.role == UserRole.BUYER, User.role == UserRole.BROKER))
        elif role in ("consumer", "service_provider"):
            query = query.filter(or_(User.role == UserRole.CONSUMER, User.role == UserRole.SERVICE_PROVIDER))
        else:
            try:
                query = query.filter(User.role == UserRole(role))
            except ValueError:
                pass

    if status_filter and status_filter != "all":
        try:
            query = query.filter(User.status == UserStatus(status_filter))
        except ValueError:
            pass

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_pattern),
                User.mobile.like(search_pattern),
                User.email.ilike(search_pattern),
                User.district.ilike(search_pattern),
                User.state.ilike(search_pattern),
            )
        )

    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/experts/pending", response_model=List[UserResponse], dependencies=[Depends(require_role(UserRole.ADMIN))])
def list_pending_experts(db: Session = Depends(get_db)):
    """List all agricultural experts waiting for credential verification."""
    experts = (
        db.query(User)
        .join(ExpertProfile, User.id == ExpertProfile.user_id)
        .filter(ExpertProfile.verification_status == VerificationStatus.PENDING)
        .order_by(User.created_at.asc())
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
        details=f"Admin {current_admin.full_name} set expert status to {payload.status.value}"
        + (f" (Reason: {payload.rejection_reason})" if payload.rejection_reason else ""),
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
        details=f"Admin {current_admin.full_name} changed user status to {payload.status.value}. Reason: {payload.reason or 'Administrative update'}",
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)


@router.get("/audit-logs", response_model=List[AuditLogResponse], dependencies=[Depends(require_role(UserRole.ADMIN))])
def get_audit_logs(
    action: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Fetch security audit logs with optional filters."""
    query = db.query(AuditLog)
    if action and action != "all":
        query = query.filter(AuditLog.action == action)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AuditLog.action.ilike(search_pattern),
                AuditLog.details.ilike(search_pattern),
                AuditLog.ip_address.like(search_pattern),
            )
        )

    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return [AuditLogResponse.model_validate(l) for l in logs]
