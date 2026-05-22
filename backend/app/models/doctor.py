import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Index,
    Integer, Numeric, String, Text, func,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.clinic import Clinic
    from app.models.user import User
    from app.models.appointment import Appointment
    from app.models.review import Review


class Doctor(Base):
    __tablename__ = "doctors"
    __table_args__ = (
        Index("ix_doctors_clinic_id", "clinic_id"),
        Index("ix_doctors_specialty", "specialty"),
        Index("ix_doctors_is_active", "is_active"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clinic_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    # Optional link to a user account (for doctor portal login)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    specialty: Mapped[str] = mapped_column(String(100), nullable=False)
    sub_specialty: Mapped[Optional[str]] = mapped_column(String(100))
    qualification: Mapped[str] = mapped_column(String(255), nullable=False)
    license_number: Mapped[Optional[str]] = mapped_column(String(100), unique=True)
    bio: Mapped[Optional[str]] = mapped_column(Text)
    photo_url: Mapped[Optional[str]] = mapped_column(Text)

    consultation_fee_kes: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    available_days: Mapped[List[int]] = mapped_column(ARRAY(Integer), nullable=False)
    slot_duration_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    max_daily_appointments: Mapped[int] = mapped_column(Integer, default=20, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=Decimal("0.00"), nullable=False)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    clinic: Mapped["Clinic"] = relationship("Clinic", back_populates="doctors")
    user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[user_id])
    appointments: Mapped[List["Appointment"]] = relationship("Appointment", back_populates="doctor")
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="doctor")

    def __repr__(self) -> str:
        return f"<Doctor id={self.id} name={self.full_name!r} specialty={self.specialty!r}>"
