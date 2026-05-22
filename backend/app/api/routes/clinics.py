from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, get_db, require_role
from app.models.appointment import Appointment, AppointmentStatus
from app.models.clinic import Clinic
from app.models.doctor import Doctor
from app.models.user import User, UserRole
from app.schemas.clinic import (
    ClinicCardResponse,
    ClinicDetailResponse,
    ClinicCreate,
    ClinicUpdate,
    DaySlotsResponse,
    DoctorCreate,
    DoctorResponse,
    TimeSlot,
)

router = APIRouter()


@router.get("/", response_model=List[ClinicCardResponse])
def list_clinics(
    county: Optional[str] = Query(None),
    specialty: Optional[str] = Query(None),
    available_today: bool = Query(False),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    q = db.query(Clinic).filter(Clinic.is_active == True)
    if county:
        q = q.filter(Clinic.county.ilike(f"%{county}%"))
    if specialty:
        q = q.filter(Clinic.specialties.contains([specialty]))
    if available_today:
        today_name = datetime.now().strftime("%A").lower()
        q = q.filter(Clinic.operating_hours[today_name].isnot(None))
    return q.order_by(Clinic.name).offset(offset).limit(limit).all()


@router.post("/", response_model=ClinicCardResponse, status_code=201)
def create_clinic(
    data: ClinicCreate,
    current_user: User = Depends(require_role(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    clinic = Clinic(**data.model_dump(), owner_id=current_user.id)
    db.add(clinic)
    db.commit()
    db.refresh(clinic)
    return clinic


@router.get("/{clinic_id}", response_model=ClinicDetailResponse)
def get_clinic(clinic_id: str, db: Session = Depends(get_db)):
    clinic = (
        db.query(Clinic)
        .options(joinedload(Clinic.doctors))
        .filter(Clinic.id == clinic_id)
        .first()
    )
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    return clinic


@router.put("/{clinic_id}", response_model=ClinicCardResponse)
def update_clinic(
    clinic_id: str,
    data: ClinicUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    if str(clinic.owner_id) != str(current_user.id) and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(clinic, field, value)
    db.commit()
    db.refresh(clinic)
    return clinic


@router.get("/{clinic_id}/slots", response_model=DaySlotsResponse)
def get_slots(
    clinic_id: str,
    slot_date: date = Query(..., alias="date"),
    doctor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")

    q = db.query(Doctor).filter(Doctor.clinic_id == clinic_id, Doctor.is_active == True)
    if doctor_id:
        q = q.filter(Doctor.id == doctor_id)
    doctors = q.all()
    if not doctors:
        return DaySlotsResponse(date=slot_date, slots=[])

    day_name = slot_date.strftime("%A").lower()

    booked_q = db.query(Appointment).filter(
        Appointment.clinic_id == clinic_id,
        Appointment.appointment_date == slot_date,
        Appointment.status.notin_([AppointmentStatus.CANCELLED]),
    )
    if doctor_id:
        booked_q = booked_q.filter(Appointment.doctor_id == doctor_id)
    booked_set = {
        (str(a.doctor_id), a.appointment_time.strftime("%H:%M"))
        for a in booked_q.all()
    }

    slots: List[TimeSlot] = []
    for doc in doctors:
        avail = [d.lower() for d in (doc.available_days or [])]
        if day_name not in avail:
            continue
        hours = (clinic.operating_hours or {}).get(day_name, {"open": "08:00", "close": "17:00"})
        oh, om = map(int, hours["open"].split(":"))
        ch, cm = map(int, hours["close"].split(":"))
        current = datetime(slot_date.year, slot_date.month, slot_date.day, oh, om)
        end = datetime(slot_date.year, slot_date.month, slot_date.day, ch, cm)
        while current < end:
            t = current.strftime("%H:%M")
            if (str(doc.id), t) not in booked_set:
                slots.append(TimeSlot(
                    time=t,
                    doctor_id=str(doc.id),
                    doctor_name=doc.full_name,
                    fee_kes=doc.consultation_fee_kes,
                ))
            current += timedelta(minutes=30)

    return DaySlotsResponse(date=slot_date, slots=slots)


@router.get("/{clinic_id}/doctors", response_model=List[DoctorResponse])
def list_doctors(clinic_id: str, db: Session = Depends(get_db)):
    if not db.query(Clinic).filter(Clinic.id == clinic_id).first():
        raise HTTPException(status_code=404, detail="Clinic not found")
    return (
        db.query(Doctor)
        .filter(Doctor.clinic_id == clinic_id, Doctor.is_active == True)
        .all()
    )


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
    if str(clinic.owner_id) != str(current_user.id) and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    doctor = Doctor(**data.model_dump(), clinic_id=clinic.id)
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor
