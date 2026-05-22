import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Boolean, CheckConstraint, DateTime,
    ForeignKey, Index, Integer, Numeric, String, Text, func,
)
from sqlalchemy.dialects.postgresql import ARRAY, INET, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.appointment import Appointment


class TriageSession(Base):
    __tablename__ = "triage_sessions"
    __table_args__ = (
        CheckConstraint(
            "severity_level IN ('mild','moderate','urgent','emergency')",
            name="ck_triage_severity",
        ),
        CheckConstraint("feedback_rating BETWEEN 1 AND 5", name="ck_triage_feedback_rating"),
        Index("ix_triage_sessions_user_id", "user_id"),
        Index("ix_triage_sessions_severity_level", "severity_level"),
        Index("ix_triage_sessions_created_at", "created_at"),
        Index("ix_triage_sessions_county", "county"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_token: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    # Nullable — anonymous triage allowed
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    symptoms: Mapped[dict] = mapped_column(JSONB, nullable=False)
    severity_level: Mapped[str] = mapped_column(String(20), nullable=False)
    confidence_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 3))
    matched_patterns: Mapped[Optional[dict]] = mapped_column(JSONB)
    recommendations: Mapped[dict] = mapped_column(JSONB, nullable=False)
    recommended_action: Mapped[Optional[str]] = mapped_column(String(50))

    patient_age: Mapped[Optional[int]] = mapped_column(Integer)
    patient_gender: Mapped[Optional[str]] = mapped_column(String(20))
    pre_existing_conditions: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))
    county: Mapped[Optional[str]] = mapped_column(String(100))

    # Outcome tracking
    led_to_appointment: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    appointment_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)
    did_visit_doctor: Mapped[Optional[bool]] = mapped_column(Boolean)
    actual_diagnosis: Mapped[Optional[str]] = mapped_column(Text)

    # Feedback
    feedback_rating: Mapped[Optional[int]] = mapped_column(Integer)
    feedback_text: Mapped[Optional[str]] = mapped_column(Text)

    # Session metadata
    session_duration_seconds: Mapped[Optional[int]] = mapped_column(Integer)
    device_type: Mapped[Optional[str]] = mapped_column(String(50))
    ip_address: Mapped[Optional[str]] = mapped_column(INET)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="triage_sessions")
    appointment: Mapped[Optional["Appointment"]] = relationship("Appointment", foreign_keys=[appointment_id])
    symptom_logs: Mapped[List["SymptomLog"]] = relationship("SymptomLog", back_populates="triage_session", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<TriageSession id={self.id} severity={self.severity_level!r}>"


class SymptomLog(Base):
    __tablename__ = "symptom_logs"
    __table_args__ = (
        CheckConstraint("severity_score BETWEEN 1 AND 10", name="ck_symptom_severity_score"),
        Index("ix_symptom_logs_triage_session_id", "triage_session_id"),
        Index("ix_symptom_logs_symptom_name", "symptom_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    triage_session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("triage_sessions.id", ondelete="CASCADE"), nullable=False)
    symptom_name: Mapped[str] = mapped_column(String(100), nullable=False)
    body_part: Mapped[Optional[str]] = mapped_column(String(100))
    duration_days: Mapped[Optional[int]] = mapped_column(Integer)
    severity_score: Mapped[Optional[int]] = mapped_column(Integer)
    onset_type: Mapped[Optional[str]] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    triage_session: Mapped["TriageSession"] = relationship("TriageSession", back_populates="symptom_logs")
