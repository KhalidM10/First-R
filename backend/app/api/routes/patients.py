from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.patient import PatientResponse, PatientUpdate

router = APIRouter()


@router.get("/me", response_model=PatientResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "date_of_birth": current_user.date_of_birth,
        "gender": current_user.gender,
        "county": current_user.county,
        "emergency_contact_name": (current_user.emergency_contact or {}).get("name"),
        "emergency_contact_phone": (current_user.emergency_contact or {}).get("phone"),
        "allergies": current_user.allergies or [],
        "chronic_conditions": [],
        "medical_history": {},
        "created_at": current_user.created_at,
    }


@router.put("/me", response_model=PatientResponse)
def update_my_profile(
    data: PatientUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updates = data.model_dump(exclude_none=True)

    # Map PatientUpdate fields → User model fields
    if "full_name" in updates:
        current_user.full_name = updates["full_name"]
    if "date_of_birth" in updates:
        current_user.date_of_birth = updates["date_of_birth"]
    if "gender" in updates:
        current_user.gender = updates["gender"]
    if "county" in updates:
        current_user.county = updates["county"]
    if "allergies" in updates:
        current_user.allergies = updates["allergies"]
    if "emergency_contact_name" in updates or "emergency_contact_phone" in updates:
        ec = current_user.emergency_contact or {}
        if "emergency_contact_name" in updates:
            ec["name"] = updates["emergency_contact_name"]
        if "emergency_contact_phone" in updates:
            ec["phone"] = updates["emergency_contact_phone"]
        current_user.emergency_contact = ec

    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "date_of_birth": current_user.date_of_birth,
        "gender": current_user.gender,
        "county": current_user.county,
        "emergency_contact_name": (current_user.emergency_contact or {}).get("name"),
        "emergency_contact_phone": (current_user.emergency_contact or {}).get("phone"),
        "allergies": current_user.allergies or [],
        "chronic_conditions": [],
        "medical_history": {},
        "created_at": current_user.created_at,
    }
