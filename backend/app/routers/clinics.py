from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db, require_role
from app.models.clinic import Clinic, Doctor
from app.models.user import User, UserRole
from app.schemas.clinic import (
    ClinicCreate,
    ClinicResponse,
    ClinicUpdate,
    DoctorCreate,
    DoctorResponse,
)

router = APIRouter()


@router.get("/", response_model=List[ClinicResponse])
def list_clinics(
    county: Optional[str] = Query(None),
    specialization: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    q = db.query(Clinic).filter(Clinic.is_active == True)
    if county:
        q = q.filter(Clinic.county.ilike(f"%{county}%"))
    if specialization:
        q = q.filter(Clinic.specializations.contains([specialization]))
    return q.order_by(Clinic.name).offset(offset).limit(limit).all()


@router.post("/", response_model=ClinicResponse, status_code=201)
def create_clinic(
    data: ClinicCreate,
    current_user: User = Depends(require_role(UserRole.CLINIC_ADMIN, UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    clinic = Clinic(**data.model_dump(), owner_id=current_user.id)
    db.add(clinic)
    db.commit()
    db.refresh(clinic)
    return clinic


@router.get("/{clinic_id}", response_model=ClinicResponse)
def get_clinic(clinic_id: str, db: Session = Depends(get_db)):
    clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    return clinic


@router.put("/{clinic_id}", response_model=ClinicResponse)
def update_clinic(
    clinic_id: str,
    data: ClinicUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    if str(clinic.owner_id) != str(current_user.id) and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(clinic, field, value)

    db.commit()
    db.refresh(clinic)
    return clinic


@router.get("/{clinic_id}/doctors", response_model=List[DoctorResponse])
def list_doctors(clinic_id: str, db: Session = Depends(get_db)):
    if not db.query(Clinic).filter(Clinic.id == clinic_id).first():
        raise HTTPException(status_code=404, detail="Clinic not found")
    return db.query(Doctor).filter(Doctor.clinic_id == clinic_id).all()


@router.post("/{clinic_id}/doctors", response_model=DoctorResponse, status_code=201)
def add_doctor(
    clinic_id: str,
    data: DoctorCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    if str(clinic.owner_id) != str(current_user.id) and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    doctor = Doctor(**data.model_dump(), clinic_id=clinic.id)
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor
