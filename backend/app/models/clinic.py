import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey,
    Index, String, Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class SubscriptionPlan(str, enum.Enum):
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class Clinic(Base):
    __tablename__ = "clinics"
    __table_args__ = (
        Index("ix_clinics_county", "county"),
        Index("ix_clinics_name", "name"),
        Index("ix_clinics_is_verified", "is_verified"),
        Index("ix_clinics_subscription_plan", "subscription_plan"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    address = Column(String(500), nullable=False)
    county = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    license_number = Column(String(100), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    subscription_plan = Column(Enum(SubscriptionPlan), default=SubscriptionPlan.BASIC)
    subscription_expires_at = Column(DateTime, nullable=True)
    # {"monday": {"open": "08:00", "close": "17:00"}, ...}
    operating_hours = Column(JSONB, default=dict)
    # ["General Practice", "Pediatrics", ...]
    specialties = Column(JSONB, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="clinic", foreign_keys=[owner_id])
    doctors = relationship("Doctor", back_populates="clinic", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="clinic")
    medicine_orders = relationship("MedicineOrder", back_populates="clinic")
    analytics = relationship("ClinicAnalytics", back_populates="clinic")
    products = relationship("Product", back_populates="clinic")


class Doctor(Base):
    __tablename__ = "doctors"
    __table_args__ = (
        Index("ix_doctors_clinic_id", "clinic_id"),
        Index("ix_doctors_specialty", "specialty"),
        Index("ix_doctors_is_active", "is_active"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    full_name = Column(String(255), nullable=False)
    specialty = Column(String(100), nullable=False)
    qualification = Column(String(255), nullable=True)  # e.g. "MBChB, MMed (Internal Medicine)"
    bio = Column(Text, nullable=True)
    # ["monday", "tuesday", "wednesday", "thursday", "friday"]
    available_days = Column(JSONB, default=list)
    consultation_fee_kes = Column(Float, default=1500.0)
    photo_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    clinic = relationship("Clinic", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")
