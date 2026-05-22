"""
Central audit logging service.

Every meaningful action in the system must call one of these methods.
Risk scoring is computed automatically — scores >= 70 are flagged HIGH_RISK.
"""
import uuid
from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import Request
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.user import User
from app.services.geo import GeoInfo, get_geo_sync, parse_user_agent

# ── Risk score thresholds ─────────────────────────────────────────────────────
HIGH_RISK_THRESHOLD = 70

# Actions that carry inherent risk penalties
_EXPORT_ACTIONS = {
    "triage.data.exported", "appointment_list.exported",
    "patients.exported", "orders.exported", "audit.exported",
}
_SENSITIVE_ACTIONS = {
    "patient.record.viewed", "medical_history.accessed",
    "patients.read.sensitive",
}
_PERMISSION_ACTIONS = {
    "permission.override.create", "permission.override.delete",
    "users.role_changed", "users.deactivate", "users.reactivate",
    "users.invite",
}


# ── Risk scorer ───────────────────────────────────────────────────────────────

def compute_risk_score(
    db: Session,
    *,
    action: str,
    user: Optional[User],
    country: Optional[str],
    hour_utc: int,
    failed_attempts_before: int = 0,
    is_new_device: bool = False,
) -> tuple[int, list[str]]:
    score = 0
    flags: list[str] = []

    if action in _EXPORT_ACTIONS:
        score += 25
        flags.append("bulk_export")

    if action in _SENSITIVE_ACTIONS:
        score += 20
        flags.append("sensitive_data_access")

    if action in _PERMISSION_ACTIONS:
        score += 40
        flags.append("permission_escalation")

    if failed_attempts_before >= 3:
        score += 30
        flags.append("multiple_failed_logins")

    # Unusual login hours (2 AM – 5 AM UTC — rough proxy for off-hours in EAT+3)
    if 2 <= hour_utc <= 5:
        score += 10
        flags.append("unusual_time")

    if is_new_device:
        score += 15
        flags.append("new_device")

    # New country: compare to the last known country for this user
    if user and country:
        last = (
            db.query(AuditLog.country)
            .filter(
                AuditLog.user_id == user.id,
                AuditLog.status == "success",
                AuditLog.country.isnot(None),
                AuditLog.country != "",
                AuditLog.created_at >= datetime.utcnow() - timedelta(days=30),
            )
            .order_by(desc(AuditLog.created_at))
            .first()
        )
        if last and last[0] != country:
            score += 20
            flags.append("new_country")

    if score >= HIGH_RISK_THRESHOLD:
        flags.append("HIGH_RISK")

    return min(score, 100), flags


# ── Core log writer ───────────────────────────────────────────────────────────

def _extract_request_context(request: Optional[Request]) -> dict:
    if request is None:
        return {
            "ip_address": "0.0.0.0",
            "user_agent": None,
            "request_id": uuid.uuid4(),
            "api_endpoint": None,
            "http_method": None,
            "duration_ms": None,
        }
    state = request.state.__dict__
    return {
        "ip_address": state.get("client_ip", "0.0.0.0"),
        "user_agent": request.headers.get("User-Agent"),
        "request_id": state.get("request_id", uuid.uuid4()),
        "api_endpoint": str(request.url.path),
        "http_method": request.method,
        "duration_ms": state.get("duration_ms"),
    }


def log_event(
    db: Session,
    *,
    action: str,
    resource_type: str,
    status: str = "success",
    request: Optional[Request] = None,
    user: Optional[User] = None,
    resource_id: Optional[str] = None,
    old_values: Optional[dict] = None,
    new_values: Optional[dict] = None,
    changed_fields: Optional[list[str]] = None,
    failure_reason: Optional[str] = None,
    acting_as: Optional[str] = None,
    risk_score: int = 0,
    flags: Optional[list] = None,
    duration_ms: Optional[int] = None,
    failed_attempts_before: int = 0,
) -> AuditLog:
    """
    Append one audit event. Caller is responsible for commit().
    """
    ctx = _extract_request_context(request)
    ip = ctx["ip_address"]
    ua_str = ctx["user_agent"]
    duration = duration_ms if duration_ms is not None else ctx.get("duration_ms")

    # Geo + device enrichment
    geo = get_geo_sync(ip)
    device_type, browser, os_name = parse_user_agent(ua_str)

    # Auto risk scoring (caller can pre-set a base; we add to it)
    hour_utc = datetime.utcnow().hour
    auto_score, auto_flags = compute_risk_score(
        db,
        action=action,
        user=user,
        country=geo.country,
        hour_utc=hour_utc,
        failed_attempts_before=failed_attempts_before,
    )
    final_score = min(risk_score + auto_score, 100)
    all_flags = list(set((flags or []) + auto_flags))

    entry = AuditLog(
        # WHO
        clinic_id=user.clinic_id if user else None,
        user_id=user.id if user else None,
        user_email=user.email if user else None,
        user_role=user.role if user else None,
        acting_as=acting_as,
        # WHAT
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        old_values=old_values,
        new_values=new_values,
        changed_fields=changed_fields,
        # WHERE
        ip_address=ip,
        user_agent=ua_str,
        device_type=device_type,
        browser=browser,
        os=os_name,
        country=geo.country,
        city=geo.city,
        # HOW
        request_id=ctx["request_id"],
        api_endpoint=ctx["api_endpoint"],
        http_method=ctx["http_method"],
        duration_ms=duration,
        # OUTCOME
        status=status,
        failure_reason=failure_reason,
        risk_score=final_score,
        flags=all_flags,
    )

    # Denormalise clinic_name for fast querying
    if user and user.clinic_id:
        try:
            from app.models.clinic import Clinic
            clinic = db.query(Clinic.name).filter(Clinic.id == user.clinic_id).first()
            if clinic:
                entry.clinic_name = clinic[0]
        except Exception:
            pass

    db.add(entry)
    return entry


# ── Specialised helpers (thin wrappers over log_event) ───────────────────────

def log_auth(
    db: Session,
    *,
    action: str,
    user: User,
    request: Request,
    success: bool,
    failure_reason: Optional[str] = None,
    failed_attempts_before: int = 0,
) -> None:
    log_event(
        db,
        action=action,
        resource_type="user",
        resource_id=str(user.id),
        status="success" if success else "failure",
        request=request,
        user=user if success else None,
        failure_reason=failure_reason,
        failed_attempts_before=failed_attempts_before,
    )


def log_data_access(
    db: Session,
    *,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    user: User,
    request: Optional[Request] = None,
    record_count: Optional[int] = None,
) -> None:
    log_event(
        db,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        status="success",
        request=request,
        user=user,
        new_values={"count": record_count} if record_count is not None else None,
    )


def log_data_change(
    db: Session,
    *,
    action: str,
    resource_type: str,
    resource_id: str,
    user: User,
    request: Optional[Request] = None,
    old_values: Optional[dict] = None,
    new_values: Optional[dict] = None,
) -> None:
    changed: list[str] = []
    if old_values and new_values:
        changed = [k for k in set(list(old_values.keys()) + list(new_values.keys()))
                   if old_values.get(k) != new_values.get(k)]

    log_event(
        db,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        status="success",
        request=request,
        user=user,
        old_values=old_values,
        new_values=new_values,
        changed_fields=changed or None,
    )


def log_permission_event(
    db: Session,
    *,
    action: str,
    resource_id: str,
    user: User,
    request: Optional[Request] = None,
    new_values: Optional[dict] = None,
) -> None:
    log_event(
        db,
        action=action,
        resource_type="permission",
        resource_id=resource_id,
        status="success",
        request=request,
        user=user,
        new_values=new_values,
    )
