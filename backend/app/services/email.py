"""
SendGrid email service with responsive HTML templates.
All sending is async via Celery tasks.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── Base layout ───────────────────────────────────────────────────────────────

_BASE_STYLES = """
  body { margin:0; padding:0; background:#F1F5F9; font-family:'Segoe UI',Arial,sans-serif; }
  .wrap { max-width:600px; margin:0 auto; padding:32px 16px; }
  .card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
  .header { background:linear-gradient(135deg,#0F172A 0%,#1E3A5F 100%); padding:28px 32px; text-align:center; }
  .header-logo { display:inline-flex; align-items:center; gap:10px; }
  .header-text { color:#fff; font-size:18px; font-weight:700; letter-spacing:-0.3px; }
  .header-sub { color:rgba(255,255,255,0.5); font-size:11px; font-weight:500; margin-top:2px; }
  .body { padding:32px; }
  .h1 { font-size:22px; font-weight:800; color:#0F172A; letter-spacing:-0.5px; margin:0 0 8px; }
  .p  { font-size:14px; color:#475569; line-height:1.6; margin:0 0 16px; }
  .btn { display:inline-block; padding:14px 28px; background:#1E40AF; color:#fff !important;
         text-decoration:none; border-radius:12px; font-size:14px; font-weight:700;
         letter-spacing:0.1px; margin:8px 0; }
  .btn-danger { background:#DC2626; }
  .detail-box { background:#F8FAFC; border-radius:12px; padding:20px; margin:20px 0; }
  .detail-row { display:flex; justify-content:space-between; padding:6px 0;
                border-bottom:1px solid #F1F5F9; font-size:13px; }
  .detail-label { color:#94A3B8; font-weight:500; }
  .detail-value { color:#0F172A; font-weight:600; }
  .divider { height:1px; background:#F1F5F9; margin:24px 0; }
  .footer { padding:20px 32px; text-align:center; }
  .footer-text { font-size:11px; color:#94A3B8; line-height:1.6; }
  .footer-link { color:#1E40AF; text-decoration:none; }
  .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; }
  .badge-green { background:#D1FAE5; color:#065F46; }
  .badge-red { background:#FEE2E2; color:#991B1B; }
  .badge-blue { background:#DBEAFE; color:#1E40AF; }
  @media(max-width:600px){ .body{padding:20px;} .header{padding:20px;} }
"""

def _wrap(inner_html: str, preview_text: str = "") -> str:
    logo_svg = (
        '<svg width="20" height="20" viewBox="0 0 22 22" fill="none">'
        '<path d="M1 11 L6 11 L8 7 L11 16 L13 6 L15 11 L21 11" '
        'stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '</svg>'
    )
    preview = f'<div style="display:none;max-height:0;overflow:hidden;">{preview_text}</div>' if preview_text else ''
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>{_BASE_STYLES}</style>
</head>
<body>
{preview}
<div class="wrap">
  <div class="card">
    <div class="header">
      <div class="header-logo">
        {logo_svg}
        <div>
          <div class="header-text">MedAssist AI</div>
          <div class="header-sub">Kenya's Health Companion</div>
        </div>
      </div>
    </div>
    {inner_html}
  </div>
  <div class="footer">
    <p class="footer-text">
      © 2025 MedAssist AI · Nairobi, Kenya<br>
      <a href="https://medassist.co.ke/unsubscribe" class="footer-link">Unsubscribe</a> ·
      <a href="https://medassist.co.ke/privacy" class="footer-link">Privacy Policy</a>
    </p>
  </div>
</div>
</body>
</html>"""


# ── Templates ─────────────────────────────────────────────────────────────────

def email_welcome(name: str, verify_url: str) -> tuple[str, str]:
    """Returns (subject, html_body)."""
    subject = f"Welcome to MedAssist AI, {name.split()[0]}! 🎉"
    body = _wrap(f"""
    <div class="body">
      <p class="h1">Welcome, {name.split()[0]}!</p>
      <p class="p">
        You're now part of MedAssist AI — Kenya's AI-powered health platform.
        Let's get your account fully set up.
      </p>
      <p style="text-align:center; margin:28px 0;">
        <a href="{verify_url}" class="btn">Verify Email Address</a>
      </p>
      <div class="detail-box">
        <p style="font-size:13px; font-weight:700; color:#0F172A; margin:0 0 12px;">What you can do with MedAssist AI:</p>
        <div style="font-size:13px; color:#475569; line-height:1.8;">
          ✅ &nbsp;AI-powered symptom checker & triage<br>
          ✅ &nbsp;Find &amp; book clinic appointments near you<br>
          ✅ &nbsp;Order medicine with home delivery<br>
          ✅ &nbsp;Track your health history &amp; records
        </div>
      </div>
      <p class="p" style="font-size:12px; color:#94A3B8;">
        This verification link expires in 24 hours.
        If you didn't create this account, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <p class="footer-text">
        Questions? Email us at <a href="mailto:support@medassist.co.ke" class="footer-link">support@medassist.co.ke</a>
      </p>
    </div>
    """, preview_text=f"Welcome {name.split()[0]}! Verify your email to get started.")
    return subject, body


def email_appointment_confirmed(
    patient_name: str,
    doctor_name: str,
    clinic_name: str,
    clinic_address: str,
    clinic_phone: str,
    date: str,
    time: str,
    reference: str,
    amount_kes: float,
    cancel_url: str,
) -> tuple[str, str]:
    subject = f"Appointment Confirmed — {date} at {time}"
    google_cal = (
        f"https://calendar.google.com/calendar/r/eventedit"
        f"?text=MedAssist+Appointment+-+{clinic_name.replace(' ','+')}"
        f"&dates={date.replace('-','')}T{time.replace(':','')}00/"
        f"{date.replace('-','')}T{time.replace(':','')}30"
        f"&location={clinic_address.replace(' ','+')}"
    )
    body = _wrap(f"""
    <div class="body">
      <p style="margin:0 0 4px;">
        <span class="badge badge-green">✓ Confirmed</span>
      </p>
      <p class="h1" style="margin-top:12px;">Appointment Confirmed</p>
      <p class="p">Hi {patient_name.split()[0]}, your appointment has been confirmed. Here are your details:</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Doctor</span><span class="detail-value">Dr. {doctor_name}</span></div>
        <div class="detail-row"><span class="detail-label">Clinic</span><span class="detail-value">{clinic_name}</span></div>
        <div class="detail-row"><span class="detail-label">Address</span><span class="detail-value">{clinic_address}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">{date}</span></div>
        <div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">{time}</span></div>
        <div class="detail-row"><span class="detail-label">Reference</span><span class="detail-value" style="font-family:monospace;">{reference}</span></div>
        <div class="detail-row" style="border:0;"><span class="detail-label">Amount</span><span class="detail-value" style="color:#1E40AF;">KES {amount_kes:,.0f}</span></div>
      </div>
      <p style="text-align:center; margin:24px 0 8px;">
        <a href="{google_cal}" class="btn">Add to Google Calendar</a>
      </p>
      <p style="text-align:center; font-size:12px; color:#94A3B8; margin:0 0 20px;">
        Clinic: {clinic_phone}
      </p>
      <div class="divider"></div>
      <p class="p" style="font-size:12px; color:#94A3B8;">
        Need to cancel? You can cancel up to 2 hours before your appointment.
        <a href="{cancel_url}" style="color:#DC2626;">Cancel appointment</a>
      </p>
    </div>
    <div class="footer">
      <p class="footer-text">
        <a href="mailto:support@medassist.co.ke" class="footer-link">support@medassist.co.ke</a>
      </p>
    </div>
    """, preview_text=f"Your appointment with Dr. {doctor_name} on {date} is confirmed.")
    return subject, body


def email_appointment_reminder(
    patient_name: str,
    doctor_name: str,
    clinic_name: str,
    clinic_address: str,
    date: str,
    time: str,
    reference: str,
    cancel_url: str,
    hours_until: int,
) -> tuple[str, str]:
    when_label = "Tomorrow" if hours_until >= 20 else f"In {hours_until} hours"
    subject = f"Appointment Reminder — {when_label}: {date} at {time}"
    body = _wrap(f"""
    <div class="body">
      <p style="margin:0 0 4px;"><span class="badge badge-blue">⏰ Reminder</span></p>
      <p class="h1" style="margin-top:12px;">You have an appointment {when_label.lower()}</p>
      <p class="p">Hi {patient_name.split()[0]}, just a reminder about your upcoming appointment.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Doctor</span><span class="detail-value">Dr. {doctor_name}</span></div>
        <div class="detail-row"><span class="detail-label">Clinic</span><span class="detail-value">{clinic_name}</span></div>
        <div class="detail-row"><span class="detail-label">Address</span><span class="detail-value">{clinic_address}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">{date}</span></div>
        <div class="detail-row" style="border:0;"><span class="detail-label">Time</span><span class="detail-value">{time}</span></div>
      </div>
      <p class="p" style="font-size:12px; color:#94A3B8;">
        Reference: <code style="font-family:monospace;">{reference}</code><br>
        Need to cancel? <a href="{cancel_url}" style="color:#DC2626;">Cancel this appointment</a>
      </p>
    </div>
    """, preview_text=f"Reminder: appointment with Dr. {doctor_name} on {date} at {time}.")
    return subject, body


def email_password_reset(
    name: str,
    reset_url: str,
    ip_address: str,
    city: str,
) -> tuple[str, str]:
    subject = "Reset your MedAssist AI password"
    body = _wrap(f"""
    <div class="body">
      <p class="h1">Reset your password</p>
      <p class="p">Hi {name.split()[0]}, we received a request to reset your MedAssist AI password.</p>
      <p style="text-align:center; margin:28px 0;">
        <a href="{reset_url}" class="btn">Reset Password</a>
      </p>
      <div class="detail-box">
        <p style="font-size:12px; color:#94A3B8; margin:0 0 8px; font-weight:600;">Request details</p>
        <div class="detail-row"><span class="detail-label">IP Address</span><span class="detail-value" style="font-family:monospace;">{ip_address}</span></div>
        <div class="detail-row" style="border:0;"><span class="detail-label">Location</span><span class="detail-value">{city}</span></div>
      </div>
      <div style="background:#FFFBEB; border-radius:12px; padding:16px; margin:16px 0;">
        <p style="font-size:13px; color:#92400E; margin:0;">
          ⚠️ This link <strong>expires in 1 hour</strong>.
          If you didn't request a password reset, please secure your account immediately.
        </p>
      </div>
      <p class="p" style="font-size:12px; color:#94A3B8;">
        If you didn't request this, you can safely ignore this email — your password won't change.
      </p>
    </div>
    """, preview_text="Reset your MedAssist AI password — link expires in 1 hour.")
    return subject, body


def email_weekly_clinic_report(
    clinic_name: str,
    admin_name: str,
    week_label: str,
    appointments_count: int,
    revenue_kes: float,
    completion_rate: float,
    new_patients: int,
    dashboard_url: str,
) -> tuple[str, str]:
    subject = f"Weekly Report: {clinic_name} — {week_label}"
    body = _wrap(f"""
    <div class="body">
      <p class="h1">Weekly Report</p>
      <p class="p">Hi {admin_name.split()[0]}, here's your weekly performance summary for <strong>{clinic_name}</strong>.</p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:20px 0;">
        <div style="background:#EFF6FF; border-radius:12px; padding:16px; text-align:center;">
          <p style="font-size:28px; font-weight:800; color:#1E40AF; margin:0;">{appointments_count}</p>
          <p style="font-size:11px; color:#1E40AF; font-weight:600; margin:4px 0 0; text-transform:uppercase; letter-spacing:0.5px;">Appointments</p>
        </div>
        <div style="background:#ECFDF5; border-radius:12px; padding:16px; text-align:center;">
          <p style="font-size:28px; font-weight:800; color:#059669; margin:0;">KES {revenue_kes:,.0f}</p>
          <p style="font-size:11px; color:#059669; font-weight:600; margin:4px 0 0; text-transform:uppercase; letter-spacing:0.5px;">Revenue</p>
        </div>
        <div style="background:#FEF3C7; border-radius:12px; padding:16px; text-align:center;">
          <p style="font-size:28px; font-weight:800; color:#D97706; margin:0;">{completion_rate:.0f}%</p>
          <p style="font-size:11px; color:#D97706; font-weight:600; margin:4px 0 0; text-transform:uppercase; letter-spacing:0.5px;">Completion Rate</p>
        </div>
        <div style="background:#F0F9FF; border-radius:12px; padding:16px; text-align:center;">
          <p style="font-size:28px; font-weight:800; color:#0284C7; margin:0;">{new_patients}</p>
          <p style="font-size:11px; color:#0284C7; font-weight:600; margin:4px 0 0; text-transform:uppercase; letter-spacing:0.5px;">New Patients</p>
        </div>
      </div>
      <p style="text-align:center; margin:28px 0;">
        <a href="{dashboard_url}" class="btn">View Full Dashboard</a>
      </p>
    </div>
    """, preview_text=f"{clinic_name}: {appointments_count} appointments, KES {revenue_kes:,.0f} revenue this week.")
    return subject, body


# ── Sender ────────────────────────────────────────────────────────────────────

def send_email(to_email: str, to_name: str, subject: str, html_body: str) -> bool:
    from app.config import get_settings
    settings = get_settings()
    if not settings.sendgrid_api_key:
        logger.info("Email (dry-run) → %s: %s", to_email, subject)
        return True
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, To, Content, From
        message = Mail(
            from_email=(settings.email_from, settings.email_from_name),
            to_emails=To(to_email, to_name),
            subject=subject,
            html_content=html_body,
        )
        sg = SendGridAPIClient(settings.sendgrid_api_key)
        response = sg.send(message)
        ok = response.status_code in (200, 202)
        if not ok:
            logger.warning("SendGrid returned %d for %s", response.status_code, to_email)
        return ok
    except Exception as exc:
        logger.error("Email send error for %s: %s", to_email, exc)
        return False
