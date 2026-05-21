import uuid
from datetime import date, datetime, time
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, model_validator

from app.models.clinic import SubscriptionPlan


class DoctorResponse(BaseModel):
    id: uuid.UUID
    clinic_id: uuid.UUID
    full_name: str
    specialty: str
    qualification: Optional[str]
    bio: Optional[str]
    available_days: List[str]
    consultation_fee_kes: float
    photo_url: Optional[str]
    is_active: bool

    model_config = {"from_attributes": True}


class ClinicCardResponse(BaseModel):
    """Lightweight clinic info for the list/search view."""
    id: uuid.UUID
    name: str
    address: str
    county: str
    phone: str
    email: Optional[str]
    is_verified: bool
    specialties: List[str]
    operating_hours: Dict[str, Any]
    latitude: Optional[float]
    longitude: Optional[float]
    distance_km: Optional[float] = None
    next_available: Optional[str] = None   # human string e.g. "Today", "Tomorrow", "Thu 22 May"
    doctor_count: int = 0

    model_config = {"from_attributes": True}


class ClinicDetailResponse(ClinicCardResponse):
    """Full clinic profile including doctors."""
    owner_id: uuid.UUID
    license_number: Optional[str]
    subscription_plan: SubscriptionPlan
    doctors: List[DoctorResponse] = []

    @model_validator(mode="after")
    def set_doctor_count(self) -> "ClinicDetailResponse":
        self.doctor_count = len([d for d in self.doctors if d.is_active])
        return self

    model_config = {"from_attributes": True}


class TimeSlot(BaseModel):
    time: str           # "09:00"
    doctor_id: str
    doctor_name: str
    fee_kes: float = 1500.0


class DaySlotsResponse(BaseModel):
    date: date
    slots: List[TimeSlot]


# ── Write schemas ─────────────────────────────────────────────────────────────

class ClinicCreate(BaseModel):
    name: str
    address: str
    county: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: str
    email: Optional[EmailStr] = None
    license_number: Optional[str] = None
    operating_hours: Optional[Dict[str, Any]] = {}
    specialties: Optional[List[str]] = []


class ClinicUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    county: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    license_number: Optional[str] = None
    operating_hours: Optional[Dict[str, Any]] = None
    specialties: Optional[List[str]] = None


class DoctorCreate(BaseModel):
    full_name: str
    specialty: str
    qualification: Optional[str] = None
    bio: Optional[str] = None
    available_days: Optional[List[str]] = []
    consultation_fee_kes: Optional[float] = 1500.0
    photo_url: Optional[str] = None
