import uuid
from datetime import datetime

from sqlalchemy import (
    Column, Date, DateTime, Float, ForeignKey, Index, Integer, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class ClinicAnalytics(Base):
    __tablename__ = "clinic_analytics"
    __table_args__ = (
        UniqueConstraint("clinic_id", "date", name="uq_clinic_analytics_clinic_date"),
        Index("ix_clinic_analytics_clinic_id", "clinic_id"),
        Index("ix_clinic_analytics_date", "date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    date = Column(Date, nullable=False)
    total_appointments = Column(Integer, default=0, nullable=False)
    completed_appointments = Column(Integer, default=0, nullable=False)
    cancelled_appointments = Column(Integer, default=0, nullable=False)
    total_revenue_kes = Column(Float, default=0.0, nullable=False)
    new_patients = Column(Integer, default=0, nullable=False)
    returning_patients = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    clinic = relationship("Clinic", back_populates="analytics")
