"""
AGRI SMART — API Dependencies & Security Guards
File: backend/app/api/deps.py
"""

from typing import Generator, List
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.config import settings
from app.core.security import decode_token
from app.models.user import User, UserRole, UserStatus, VerificationStatus

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    """Validate JWT token and retrieve the user from the database."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure the user is active and not suspended."""
    if not current_user.is_active or current_user.status == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is suspended or inactive. Please contact support.",
        )
    return current_user


def require_role(*allowed_roles: UserRole):
    """
    Role-Based Access Control (RBAC) dependency factory.
    Example usage:
        @router.get("/admin-only", dependencies=[Depends(require_role(UserRole.ADMIN))])
    """
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: requires one of roles {[r.value for r in allowed_roles]}",
            )
        return current_user

    return role_checker


def require_verified_expert(
    current_user: User = Depends(require_role(UserRole.EXPERT)),
) -> User:
    """Ensure the expert has been verified by an administrator."""
    if not current_user.expert_profile or current_user.expert_profile.verification_status != VerificationStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your expert credentials are still pending verification by an administrator.",
        )
    return current_user
