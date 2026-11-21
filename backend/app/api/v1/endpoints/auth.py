"""
AGRI SMART — Authentication Endpoints
File: backend/app/api/v1/endpoints/auth.py
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.models.user import User, UserRole, UserStatus, FarmerProfile, ExpertProfile, VerificationStatus, AuditLog
from app.models.marketplace import BuyerProfile, ConsumerProfile
from app.schemas.user import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from app.api.deps import get_current_active_user

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserRegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Register a new user (Farmer or Agricultural Expert).
    """
    # 1. Check if mobile already exists
    existing_user = db.query(User).filter(User.mobile == user_in.mobile).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this mobile number is already registered.",
        )

    # 2. Check email if provided
    if user_in.email:
        existing_email = db.query(User).filter(User.email == user_in.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address is already registered.",
            )

    # 3. Create user account
    initial_status = (
        UserStatus.PENDING_VERIFICATION if user_in.role == UserRole.EXPERT else UserStatus.ACTIVE
    )
    user = User(
        full_name=user_in.full_name,
        mobile=user_in.mobile,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
        status=initial_status,
        preferred_language=user_in.preferred_language,
        state=user_in.state,
        district=user_in.district,
        village=user_in.village,
        is_active=True,
    )
    db.add(user)
    db.flush()  # assign user.id

    # 4. Create role-specific profile
    if user_in.role == UserRole.FARMER:
        farmer_profile = FarmerProfile(
            user_id=user.id,
            total_land_acres=user_in.total_land_acres or 0.0,
            primary_crops=user_in.primary_crops,
        )
        db.add(farmer_profile)

    elif user_in.role == UserRole.EXPERT:
        expert_profile = ExpertProfile(
            user_id=user.id,
            qualifications=user_in.qualifications or "N/A",
            specialisation=user_in.specialisation or "General Agriculture",
            experience_years=user_in.experience_years or 1,
            institution=user_in.institution or "Independent",
            verification_status=VerificationStatus.PENDING,
        )
        db.add(expert_profile)

    elif user_in.role in (UserRole.BUYER, UserRole.BROKER):
        buyer_profile = BuyerProfile(
            user_id=user.id,
            business_name=user_in.business_name or f"{user_in.full_name} Trading",
            business_type=user_in.business_type or "Trader",
            gst_number=user_in.gst_number,
            license_number=user_in.license_number,
            commodities_of_interest=user_in.commodities_of_interest,
            preferred_districts=user_in.preferred_districts,
            warehouse_address=user_in.warehouse_address,
        )
        db.add(buyer_profile)

    elif user_in.role in (UserRole.CONSUMER, UserRole.SERVICE_PROVIDER):
        consumer_profile = ConsumerProfile(
            user_id=user.id,
            delivery_address=user_in.delivery_address,
            preferred_commodities=user_in.preferred_commodities,
            is_organic_preferred=user_in.is_organic_preferred or False,
            household_size=user_in.household_size or 4,
        )
        db.add(consumer_profile)

    # 5. Log registration in AuditLog
    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        user_id=user.id,
        action="USER_REGISTER",
        resource_type="users",
        resource_id=str(user.id),
        ip_address=client_ip,
        details=f"Registered as {user.role.value}",
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    # 6. Generate access token
    access_token = create_access_token(subject=user.id, role=user.role.value)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(
    login_data: UserLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Authenticate user with mobile number or email and password.
    """
    query_val = login_data.mobile_or_email.strip()
    user = db.query(User).filter(
        or_(User.mobile == query_val, User.email == query_val)
    ).first()

    client_ip = request.client.host if request.client else None

    if not user or not verify_password(login_data.password, user.hashed_password):
        audit = AuditLog(
            user_id=user.id if user else None,
            action="LOGIN_FAILED",
            resource_type="users",
            ip_address=client_ip,
            details=f"Failed login attempt for identifier: {query_val}",
        )
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect mobile number, email, or password.",
        )

    if not user.is_active or user.status == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been suspended or deactivated. Please contact support.",
        )

    # Log successful login
    audit = AuditLog(
        user_id=user.id,
        action="LOGIN_SUCCESS",
        resource_type="users",
        resource_id=str(user.id),
        ip_address=client_ip,
        details=f"Logged in as {user.role.value}",
    )
    db.add(audit)
    db.commit()

    access_token = create_access_token(subject=user.id, role=user.role.value)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Retrieve the current logged-in user profile."""
    return UserResponse.model_validate(current_user)
