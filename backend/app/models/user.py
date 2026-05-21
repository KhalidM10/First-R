import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    PATIENT = "patient"
    CLINIC_ADMIN = "clinic_admin"
    SUPER_ADMIN = "super_admin"


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_email", "email", unique=True),
        Index("ix_users_phone", "phone", unique=True),
        Index("ix_users_role", "role"),
        Index("ix_users_location", "location"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)  # +254XXXXXXXXX format
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.PATIENT)
    location = Column(String(100), nullable=True)  # Kenyan county
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    clinic = relationship(
        "Clinic", back_populates="owner", uselist=False, foreign_keys="Clinic.owner_id"
    )
    patient_profile = relationship("Patient", back_populates="user", uselist=False)
    appointments = relationship(
        "Appointment", back_populates="patient", foreign_keys="Appointment.patient_id"
    )
    triage_sessions = relationship("TriageSession", back_populates="user")
    medicine_orders = relationship("MedicineOrder", back_populates="patient")
