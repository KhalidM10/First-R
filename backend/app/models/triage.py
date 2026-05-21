import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, ForeignKey,
    Index, Integer, String,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class SeverityLevel(str, enum.Enum):
    MILD = "mild"
    MODERATE = "moderate"
    URGENT = "urgent"


class RecommendedAction(str, enum.Enum):
    REST_AT_HOME = "rest_at_home"
    VISIT_CLINIC = "visit_clinic"
    EMERGENCY = "emergency"


class TriageSession(Base):
    __tablename__ = "triage_sessions"
    __table_args__ = (
        Index("ix_triage_sessions_user_id", "user_id"),
        Index("ix_triage_sessions_created_at", "created_at"),
        Index("ix_triage_sessions_severity_level", "severity_level"),
        Index("ix_triage_sessions_county", "county"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # nullable — allows anonymous (unauthenticated) triage
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    symptoms = Column(JSONB, default=list)           # ["headache", "fever"]
    severity_level = Column(Enum(SeverityLevel), nullable=True)
    recommendations = Column(JSONB, default=list)    # list of recommendation strings
    recommended_action = Column(Enum(RecommendedAction), nullable=True)
    user_age = Column(Integer, nullable=True)
    user_gender = Column(String(10), nullable=True)  # male / female / other
    county = Column(String(100), nullable=True)
    did_visit_doctor = Column(Boolean, nullable=True)  # post-visit feedback
    session_duration_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="triage_sessions")
    symptom_logs = relationship(
        "SymptomLog", back_populates="triage_session", cascade="all, delete-orphan"
    )


class SymptomLog(Base):
    __tablename__ = "symptom_logs"
    __table_args__ = (
        Index("ix_symptom_logs_session_id", "triage_session_id"),
        Index("ix_symptom_logs_symptom_name", "symptom_name"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    triage_session_id = Column(
        UUID(as_uuid=True), ForeignKey("triage_sessions.id"), nullable=False
    )
    symptom_name = Column(String(255), nullable=False)
    duration_days = Column(Integer, nullable=True)
    severity_score = Column(Integer, nullable=True)  # 1–10
    body_part = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    triage_session = relationship("TriageSession", back_populates="symptom_logs")
