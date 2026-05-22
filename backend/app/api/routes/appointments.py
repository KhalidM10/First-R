from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.clinic import Clinic
from app.models.doctor import Doctor
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentResponse, AppointmentUpdate

router = APIRouter()


def _fetch(db: Session, appointment_id: str) -> Appointment:
    appt = (
        db.query(Appointment)
        .options(joinedload(Appointment.clinic), joinedload(Appointment.doctor))
        .filter(Appointment.id == appointment_id)
        .first()
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def book_appointment(
    data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    clinic = db.query(Clinic).filter(
        Clinic.id == data.clinic_id, Clinic.is_active == True
    ).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")

    if data.doctor_id:
        doctor = db.query(Doctor).filter(
            Doctor.id == data.doctor_id,
            Doctor.clinic_id == data.clinic_id,
            Doctor.is_active == True,
        ).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found at this clinic")

    # Prevent double-booking
    conflict = db.query(Appointment).filter(
        Appointment.clinic_id == data.clinic_id,
        Appointment.doctor_id == data.doctor_id,
        Appointment.appointment_date == data.appointment_date,
        Appointment.appointment_time == data.appointment_time,
        Appointment.status.notin_([AppointmentStatus.CANCELLED]),
    ).first()
    if conflict:
        raise HTTPException(
            status_code=409,
            detail="This slot was just booked. Please select a different time.",
        )

    appt_dt = datetime.combine(data.appointment_date, data.appointment_time)
    if appt_dt <= datetime.now():
        raise HTTPException(status_code=400, detail="Appointment must be in the future")

    appointment = Appointment(
        patient_id=current_user.id,
        clinic_id=data.clinic_id,
        doctor_id=data.doctor_id,
        appointment_date=data.appointment_date,
        appointment_time=data.appointment_time,
        reason=data.reason,
        amount_kes=data.amount_kes or 0.0,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return _fetch(db, str(appointment.id))


@router.get("/my", response_model=List[AppointmentResponse])
def my_appointments(
    filter: Optional[str] = Query(None, description="upcoming | past | cancelled"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = (
        db.query(Appointment)
        .options(joinedload(Appointment.clinic), joinedload(Appointment.doctor))
        .filter(Appointment.patient_id == current_user.id)
    )
    today = date.today()
    if filter == "upcoming":
        q = q.filter(
            Appointment.appointment_date >= today,
            Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
        )
    elif filter == "past":
        q = q.filter(
            Appointment.appointment_date < today,
            Appointment.status != AppointmentStatus.CANCELLED,
        )
    elif filter == "cancelled":
        q = q.filter(Appointment.status == AppointmentStatus.CANCELLED)
    return q.order_by(
        Appointment.appointment_date.desc(), Appointment.appointment_time.desc()
    ).all()


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _fetch(db, appointment_id)


@router.patch("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appt = _fetch(db, appointment_id)
    if str(appt.patient_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your appointment")
    if appt.status == AppointmentStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Already cancelled")
    if appt.status == AppointmentStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed appointment")

    appt_dt = datetime.combine(appt.appointment_date, appt.appointment_time)
    if appt_dt - datetime.now() < timedelta(hours=2):
        raise HTTPException(
            status_code=400,
            detail="Appointments can only be cancelled at least 2 hours before the scheduled time.",
        )

    appt.status = AppointmentStatus.CANCELLED
    db.commit()
    db.refresh(appt)
    return _fetch(db, str(appt.id))
