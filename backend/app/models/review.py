import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean, CheckConstraint, DateTime,
    ForeignKey, Index, Integer, String, Text, UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.clinic import Clinic
    from app.models.user import User
    from app.models.doctor import Doctor
    from app.models.appointment import Appointment


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_review_rating"),
        UniqueConstraint("appointment_id", name="uq_review_appointment"),
        Index("ix_reviews_clinic_id", "clinic_id"),
        Index("ix_reviews_patient_id", "patient_id"),
        Index("ix_reviews_doctor_id", "doctor_id"),
        Index("ix_reviews_is_published", "is_published"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clinic_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    doctor_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=True)
    appointment_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("appointments.id"), unique=True, nullable=True)

    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255))
    body: Mapped[Optional[str]] = mapped_column(Text)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Clinic response
    response: Mapped[Optional[str]] = mapped_column(Text)
    response_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    clinic: Mapped["Clinic"] = relationship("Clinic", back_populates="reviews")
    patient: Mapped["User"] = relationship("User", foreign_keys=[patient_id], back_populates="reviews")
    doctor: Mapped[Optional["Doctor"]] = relationship("Doctor", back_populates="reviews")
    appointment: Mapped[Optional["Appointment"]] = relationship("Appointment", back_populates="review")
