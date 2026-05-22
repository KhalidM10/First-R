import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, field_validator


class SymptomLogCreate(BaseModel):
    symptom_name: str
    duration_days: Optional[int] = None
    severity_score: Optional[int] = None  # 1–10
    body_part: Optional[str] = None

    @field_validator("severity_score")
    @classmethod
    def validate_score(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 10):
            raise ValueError("severity_score must be between 1 and 10")
        return v


class TriageRequest(BaseModel):
    symptoms: List[str]
    symptom_logs: Optional[List[SymptomLogCreate]] = []
    user_age: Optional[int] = None
    user_gender: Optional[str] = None
    county: Optional[str] = None


class SymptomLogResponse(BaseModel):
    id: uuid.UUID
    symptom_name: str
    duration_days: Optional[int]
    severity_score: Optional[int]
    body_part: Optional[str]

    model_config = {"from_attributes": True}


class TriageSessionResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    symptoms: List[str]
    severity_level: Optional[str]
    recommendations: List[str]
    recommended_action: Optional[str]
    user_age: Optional[int]
    user_gender: Optional[str]
    county: Optional[str]
    session_duration_seconds: Optional[int]
    symptom_logs: List[SymptomLogResponse]
    created_at: datetime

    model_config = {"from_attributes": True}


class TriageFeedback(BaseModel):
    did_visit_doctor: bool


# ── New schemas for the /analyze route ───────────────────────────────────────

class TriageAnalyzeRequest(BaseModel):
    symptoms: List[str]
    symptom_logs: Optional[List[SymptomLogCreate]] = []
    pre_existing_conditions: Optional[List[str]] = []
    user_age: Optional[int] = None
    user_gender: Optional[str] = None
    county: Optional[str] = None
    duration_days: Optional[int] = None  # fallback duration for all symptoms


class TriageRecommendationsResponse(BaseModel):
    immediate_action: str
    home_care: List[str]
    when_to_escalate: List[str]
    should_book_appointment: bool
    emergency: bool


class TriageAnalyzeResponse(BaseModel):
    session_id: str
    severity: str
    confidence: float
    matched_conditions: List[str]
    recommendations: Dict[str, Any]
    suggested_specializations: List[str]
    disclaimer: str
    saved_to_db: bool
