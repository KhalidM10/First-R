"""
Africa's Talking SMS service.
All sending is fire-and-forget; never blocks the API response.
Call via Celery tasks for async delivery.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def _get_client():
    from app.config import get_settings
    import africastalking
    settings = get_settings()
    if not settings.africastalking_api_key:
        logger.warning("SMS: AFRICASTALKING_API_KEY not set — SMS disabled")
        return None
    africastalking.initialize(settings.africastalking_username, settings.africastalking_api_key)
    return africastalking.SMS


def send_sms(phone: str, message: str) -> bool:
    """Send a single SMS. Returns True on success."""
    sms = _get_client()
    if not sms:
        logger.info("SMS (dry-run) → %s: %s", phone[:7] + "***", message[:60])
        return True  # Treat as success in dev/sandbox
    try:
        resp = sms.send(message, [phone])
        recipients = resp.get("SMSMessageData", {}).get("Recipients", [])
        ok = any(r.get("status") == "Success" for r in recipients)
        if not ok:
            logger.warning("SMS failed for %s: %s", phone[:7] + "***", resp)
        return ok
    except Exception as exc:
        logger.error("SMS exception for %s: %s", phone[:7] + "***", exc)
        return False


# ── Templates ─────────────────────────────────────────────────────────────────

def sms_appointment_confirmed(
    patient_name: str,
    doctor_name: str,
    clinic_name: str,
    date: str,
    time: str,
    reference: str,
) -> str:
    return (
        f"MedAssist AI: Hi {patient_name}, your appointment with Dr. {doctor_name} "
        f"at {clinic_name} is confirmed for {date} at {time}. "
        f"Ref: {reference}. Need help? support@medassist.co.ke"
    )


def sms_appointment_reminder(
    patient_name: str,
    date: str,
    time: str,
    doctor_name: str,
    clinic_name: str,
    clinic_address: str,
    hours_until: int,
) -> str:
    when = "tomorrow" if hours_until >= 20 else f"in {hours_until} hours"
    return (
        f"Reminder: Hi {patient_name}, you have an appointment {when} ({date}) "
        f"at {time} with Dr. {doctor_name} at {clinic_name}. "
        f"Address: {clinic_address}. Reply CANCEL to cancel."
    )


def sms_appointment_cancelled(patient_name: str, reference: str) -> str:
    return (
        f"MedAssist AI: Hi {patient_name}, your appointment (Ref: {reference}) "
        f"has been cancelled. Book a new one at medassist.co.ke"
    )


def sms_order_ready(
    patient_name: str,
    order_number: str,
    clinic_name: str,
    clinic_address: str,
    expiry_date: str,
) -> str:
    return (
        f"MedAssist AI: Hi {patient_name}, your order #{order_number} is ready "
        f"for pickup at {clinic_name}, {clinic_address}. "
        f"Valid until {expiry_date}."
    )


def sms_order_delivered(patient_name: str, order_number: str, order_id: str) -> str:
    return (
        f"MedAssist AI: Hi {patient_name}, your order #{order_number} has been "
        f"delivered. Rate your experience: medassist.co.ke/review/{order_id}"
    )


def sms_login_alert(patient_name: str, city: str, country: str) -> str:
    return (
        f"MedAssist AI: Hi {patient_name}, a new login to your account was "
        f"detected from {city}, {country}. "
        f"Not you? Visit medassist.co.ke/security immediately."
    )
