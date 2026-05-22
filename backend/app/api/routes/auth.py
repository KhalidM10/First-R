from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.core.audit import log_login
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.permissions import get_user_permissions, invalidate_cache

router = APIRouter()


def _build_token_response(db: Session, user: User) -> TokenResponse:
    permissions = sorted(get_user_permissions(db, user))
    return TokenResponse(
        access_token=create_access_token({"sub": str(user.id), "role": user.role}),
        refresh_token=create_refresh_token({"sub": str(user.id)}),
        user=UserResponse.model_validate(user),
        permissions=permissions,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.phone == data.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")

    user = User(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        password_hash=hash_password(data.password),
        role=data.role or "patient",
        county=data.county,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _build_token_response(db, user)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password_hash):
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            from app.config import get_settings
            settings = get_settings()
            if user.failed_login_attempts >= settings.max_login_attempts:
                from datetime import timedelta
                user.locked_until = datetime.utcnow() + timedelta(minutes=settings.lockout_minutes)
            log_login(db, user=user, request=request, success=False, failure_reason="wrong_password")
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    if user.locked_until and user.locked_until > datetime.utcnow().replace(tzinfo=user.locked_until.tzinfo):
        raise HTTPException(status_code=status.HTTP_423_LOCKED, detail="Account temporarily locked")

    # Reset failed attempts on successful login
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = datetime.utcnow()

    forwarded = request.headers.get("X-Forwarded-For")
    user.last_login_ip = (
        forwarded.split(",")[0].strip()
        if forwarded
        else (request.client.host if request.client else None)
    )

    log_login(db, user=user, request=request, success=True)
    db.commit()

    invalidate_cache(str(user.id))
    return _build_token_response(db, user)


@router.get("/me", response_model=TokenResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return current user profile + fresh permissions list."""
    return _build_token_response(db, current_user)
