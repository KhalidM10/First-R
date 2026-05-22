"""
Celery email tasks.
"""
import logging

from app.celery_app import celery
from app.services.email import send_email

logger = logging.getLogger(__name__)


@celery.task(
    name="app.tasks.email_tasks.send_email_task",
    bind=True,
    max_retries=3,
    default_retry_delay=120,
)
def send_email_task(self, to_email: str, to_name: str, subject: str, html_body: str) -> bool:
    try:
        return send_email(to_email, to_name, subject, html_body)
    except Exception as exc:
        logger.error("Email task failed for %s: %s", to_email, exc)
        raise self.retry(exc=exc)


@celery.task(
    name="app.tasks.email_tasks.send_weekly_clinic_reports",
    bind=True,
)
def send_weekly_clinic_reports(self) -> dict:
    """
    Celery Beat task: send weekly summary emails to all clinic admins.
    Schedule in celery_app.beat_schedule for every Monday 07:00 EAT.
    """
    from app.database import SessionLocal
    from app.models.user import User, UserRole
    from app.models.clinic import Clinic
    from app.models.appointment import Appointment, AppointmentStatus
    from app.services.email import email_weekly_clinic_report
    from sqlalchemy import func
    from datetime import date, timedelta

    db = SessionLocal()
    sent = 0
    try:
        today = date.today()
        week_start = today - timedelta(days=7)

        admins = (
            db.query(User)
            .filter(User.role == UserRole.CLINIC_ADMIN, User.is_active == True)
            .all()
        )
        for admin in admins:
            try:
                clinic = db.query(Clinic).filter(Clinic.owner_id == admin.id).first()
                if not clinic:
                    continue

                appt_count = (
                    db.query(func.count(Appointment.id))
                    .filter(
                        Appointment.clinic_id == clinic.id,
                        Appointment.appointment_date >= week_start,
                        Appointment.appointment_date <= today,
                    )
                    .scalar() or 0
                )
                revenue = (
                    db.query(func.coalesce(func.sum(Appointment.amount_kes), 0))
                    .filter(
                        Appointment.clinic_id == clinic.id,
                        Appointment.status == AppointmentStatus.COMPLETED,
                        Appointment.appointment_date >= week_start,
                    )
                    .scalar() or 0
                )
                total = db.query(func.count(Appointment.id)).filter(Appointment.clinic_id == clinic.id).scalar() or 1
                done = db.query(func.count(Appointment.id)).filter(
                    Appointment.clinic_id == clinic.id,
                    Appointment.status == AppointmentStatus.COMPLETED,
                ).scalar() or 0

                subject, html = email_weekly_clinic_report(
                    clinic_name=clinic.name,
                    admin_name=admin.full_name,
                    week_label=f"{week_start.strftime('%d %b')} – {today.strftime('%d %b %Y')}",
                    appointments_count=appt_count,
                    revenue_kes=float(revenue),
                    completion_rate=round(done / total * 100, 1),
                    new_patients=0,
                    dashboard_url="https://medassist.co.ke/clinic-dashboard",
                )
                send_email(admin.email, admin.full_name, subject, html)
                sent += 1
            except Exception as exc:
                logger.error("Weekly report for %s failed: %s", admin.email, exc)
    finally:
        db.close()

    return {"sent": sent}
