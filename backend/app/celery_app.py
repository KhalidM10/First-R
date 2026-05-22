"""
Celery worker configuration.
Broker: Redis db=1   Result backend: Redis db=2
Run with:  celery -A app.celery_app worker -l info
Beat:      celery -A app.celery_app beat   -l info
"""
from celery import Celery
from celery.schedules import crontab

from app.config import get_settings

settings = get_settings()

celery = Celery(
    "medassist",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.tasks.sms_tasks",
        "app.tasks.email_tasks",
    ],
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Nairobi",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Retry settings
    task_max_retries=3,
    task_default_retry_delay=60,
)

# ── Scheduled tasks (Celery Beat) ────────────────────────────────────────────

celery.conf.beat_schedule = {
    # Fire every minute — task checks which appointments need a reminder
    "appointment-24hr-reminders": {
        "task": "app.tasks.sms_tasks.send_appointment_reminders",
        "schedule": crontab(minute="*/5"),  # every 5 min to catch newly booked
        "args": (24,),
    },
    "appointment-2hr-reminders": {
        "task": "app.tasks.sms_tasks.send_appointment_reminders",
        "schedule": crontab(minute="*/5"),
        "args": (2,),
    },
}
