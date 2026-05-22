"""
Celery SMS tasks.
"""
import logging
from datetime import datetime, timedelta, timezone

from app.celery_app import celery
from app.services.sms import send_sms

logger = logging.getLogger(__name__)


@celery.task(
    name="app.tasks.sms_tasks.send_sms_task",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_sms_task(self, phone: str, message: str) -> bool:
    try:
        return send_sms(phone, message)
    except Exception as exc:
        logger.error("SMS task failed: %s", exc)
        raise self.retry(exc=exc)


@celery.task(
    name="app.tasks.sms_tasks.send_appointment_reminders",
    bind=True,
)
def send_appointment_reminders(self, hours_before: int) -> dict:
    """
    Celery Beat task: scan appointments that fall exactly `hours_before` hours
    from now (±5 min window) and haven't had a reminder sent yet.
    """
    from app.database import SessionLocal
    from app.models.appointment import Appointment, AppointmentStatus
    from app.models.user import User
    from app.models.clinic import Clinic
    from app.models.doctor import Doctor
    from app.services.sms import sms_appointment_reminder
    from sqlalchemy import func
    from datetime import date

    db = SessionLocal()
    sent = 0
    try:
        now = datetime.now(timezone.utc)
        # Target window: appointments whose datetime is now+hours_before ±5min
        target_low = now + timedelta(hours=hours_before, minutes=-5)
        target_high = now + timedelta(hours=hours_before, minutes=5)

        appts = (
            db.query(Appointment)
            .filter(
                Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING]),
                # appointment_date + appointment_time combined would require func.make_timestamp
                # Simplified: filter date and handle time in Python
            )
            .all()
        )

        for appt in appts:
            try:
                appt_dt = datetime.combine(appt.appointment_date, appt.appointment_time)
                if not (target_low.replace(tzinfo=None) <= appt_dt <= target_high.replace(tzinfo=None)):
                    continue

                # Check reminder_sent flags in appt.data to avoid duplicates
                data = appt.data or {}
                reminder_key = f"sms_reminder_{hours_before}h"
                if data.get(reminder_key):
                    continue

                patient = db.query(User).filter(User.id == appt.patient_id).first()
                clinic = db.query(Clinic).filter(Clinic.id == appt.clinic_id).first()
                doctor = db.query(Doctor).filter(Doctor.id == appt.doctor_id).first() if appt.doctor_id else None

                if not patient or not patient.phone:
                    continue

                msg = sms_appointment_reminder(
                    patient_name=patient.full_name,
                    date=str(appt.appointment_date),
                    time=str(appt.appointment_time)[:5],
                    doctor_name=doctor.full_name if doctor else "your doctor",
                    clinic_name=clinic.name if clinic else "the clinic",
                    clinic_address=clinic.address if clinic else "",
                    hours_until=hours_before,
                )
                send_sms(patient.phone, msg)

                # Mark as sent
                appt.data = {**data, reminder_key: True}
                db.commit()
                sent += 1
            except Exception as exc:
                logger.error("Reminder for appt %s failed: %s", appt.id, exc)

    finally:
        db.close()

    return {"sent": sent, "hours_before": hours_before}
