"""
Rule-based triage engine — Phase 1.
Conservative by design: escalates on uncertainty rather than under-triaging.
This module is imported by the backend triage router; the ML upgrade (Phase 2)
will swap out assess() without changing the TriageResult contract.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EMERGENCY = "emergency"


@dataclass
class TriageResult:
    severity: Severity
    recommendation: str
    escalate: bool
    follow_up_questions: List[str] = field(default_factory=list)
    suggested_specializations: List[str] = field(default_factory=list)


class TriageEngine:
    """
    Conservative rule-based triage.
    Rules are evaluated top-down; first match wins.
    All symptom matching is case-insensitive substring.
    """

    EMERGENCY_KEYWORDS = [
        "chest pain", "difficulty breathing", "can't breathe", "shortness of breath",
        "unconscious", "unresponsive", "not responding", "severe bleeding",
        "stroke", "face drooping", "arm weakness", "sudden numbness",
        "seizure", "convulsions", "anaphylaxis", "severe allergic reaction",
        "choking", "poisoning", "overdose", "severe burns", "drowning",
        "heart attack", "cardiac",
    ]

    HIGH_KEYWORDS = [
        "high fever", "fever above 39", "fever over 39", "very high temperature",
        "persistent vomiting", "can't keep fluids", "severe abdominal pain",
        "severe back pain", "blood in urine", "blood in stool", "coughing blood",
        "severe dizziness", "fainting", "passed out", "extreme fatigue",
        "confusion", "disorientation", "rapid heart rate", "palpitations",
        "severe dehydration", "pregnancy complication", "miscarriage",
    ]

    MEDIUM_KEYWORDS = [
        "fever", "high temperature", "moderate pain", "persistent cough",
        "headache", "diarrhea", "nausea", "vomiting", "rash", "skin rash",
        "sore throat", "ear pain", "eye pain", "eye redness", "urinary pain",
        "burning urination", "joint pain", "swollen", "swelling", "toothache",
        "back pain", "abdominal pain", "stomach pain", "stomach ache",
        "cold", "flu", "runny nose", "blocked nose",
    ]

    def assess(self, symptoms: List[str], answers: Dict[str, Any]) -> TriageResult:
        text = " ".join(symptoms).lower()
        duration_days = int(answers.get("duration_days", 0))

        if self._matches_any(text, self.EMERGENCY_KEYWORDS):
            return TriageResult(
                severity=Severity.EMERGENCY,
                recommendation=(
                    "URGENT: Seek emergency medical care immediately. "
                    "Go to the nearest emergency room or call 0800 723 253 (Kenya Emergency)."
                ),
                escalate=True,
                suggested_specializations=["Emergency Medicine"],
            )

        if self._matches_any(text, self.HIGH_KEYWORDS):
            return TriageResult(
                severity=Severity.HIGH,
                recommendation=(
                    "Please see a doctor today. Your symptoms need prompt medical attention. "
                    "Book an urgent appointment or visit a clinic walk-in."
                ),
                escalate=True,
                follow_up_questions=self._follow_ups(text),
                suggested_specializations=self._specializations(text),
            )

        # Medium: known symptoms OR symptoms lingering > 7 days (conservative escalation)
        if self._matches_any(text, self.MEDIUM_KEYWORDS) or duration_days > 7:
            return TriageResult(
                severity=Severity.MEDIUM,
                recommendation=(
                    "You should see a doctor within 1–2 days. "
                    "Book an appointment at a nearby clinic. Rest and stay hydrated in the meantime."
                ),
                escalate=False,
                follow_up_questions=self._follow_ups(text),
                suggested_specializations=self._specializations(text),
            )

        return TriageResult(
            severity=Severity.LOW,
            recommendation=(
                "Your symptoms appear mild. Rest, stay hydrated, and monitor closely. "
                "Book an appointment if symptoms persist beyond 3 days or worsen."
            ),
            escalate=False,
            follow_up_questions=self._follow_ups(text),
            suggested_specializations=["General Practice"],
        )

    @staticmethod
    def _matches_any(text: str, keywords: List[str]) -> bool:
        return any(kw in text for kw in keywords)

    @staticmethod
    def _follow_ups(text: str) -> List[str]:
        questions: List[str] = []
        if "fever" in text or "temperature" in text:
            questions.append("What is your current temperature reading?")
        if "cough" in text:
            questions.append("Is the cough producing mucus? If yes, what colour?")
        if "pain" in text:
            questions.append("On a scale of 1–10, how severe is the pain?")
        if not questions:
            questions.append("How long have you had these symptoms?")
        return questions[:3]

    @staticmethod
    def _specializations(text: str) -> List[str]:
        if any(k in text for k in ["chest", "heart", "cardiac", "palpitation"]):
            return ["Cardiology", "Emergency Medicine"]
        if any(k in text for k in ["cough", "breathing", "lung", "respiratory"]):
            return ["Pulmonology", "General Practice"]
        if any(k in text for k in ["stomach", "abdominal", "diarrhea", "vomiting", "nausea"]):
            return ["Gastroenterology", "General Practice"]
        if any(k in text for k in ["headache", "head", "dizz", "confused"]):
            return ["Neurology", "General Practice"]
        if any(k in text for k in ["rash", "skin", "itch"]):
            return ["Dermatology", "General Practice"]
        if any(k in text for k in ["urine", "urinary", "kidney"]):
            return ["Urology", "General Practice"]
        return ["General Practice"]
