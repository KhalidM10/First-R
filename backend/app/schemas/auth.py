import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, field_validator

from app.models.user import VALID_ROLES


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    county: Optional[str] = None
    role: Optional[str] = "patient"

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("phone")
    @classmethod
    def phone_format(cls, v: str) -> str:
        if not v.startswith("+254"):
            raise ValueError("Phone must be in Kenya format: +254XXXXXXXXX")
        return v

    @field_validator("role")
    @classmethod
    def valid_role(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in VALID_ROLES:
            raise ValueError(f"Role must be one of: {', '.join(VALID_ROLES)}")
        # Public registration can only create patient accounts
        if v and v != "patient":
            raise ValueError("Only patient accounts can be self-registered")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None
    backup_code: Optional[str] = None


class UserResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    phone: str
    role: str
    clinic_id: Optional[uuid.UUID]
    county: Optional[str]
    is_active: bool
    is_email_verified: bool
    avatar_url: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
    permissions: List[str] = []
