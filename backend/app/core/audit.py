"""
Audit logging service.

Writes immutable records to audit_logs. The table is protected at DB level
by rules that prevent UPDATE and DELETE, so these records are permanent.
"""
import uuid
from typing import Any, Optional

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.user import User


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
    failure_reason: Optional[str] = None,
    risk_score: int = 0,
    flags: Optional[list] = None,
    duration_ms: Optional[int] = None,
) -> AuditLog:
    """
    Append an audit event. Call within an open transaction — caller commits.
    """
    ip = "0.0.0.0"
    user_agent = None
    request_id = uuid.uuid4()

    if request:
        # Extract real IP, respecting X-Forwarded-For from nginx
        forwarded = request.headers.get("X-Forwarded-For")
        ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "0.0.0.0")
        user_agent = request.headers.get("User-Agent")
        # Re-use request_id if middleware injected one
        rid = request.state.__dict__.get("request_id")
        if rid:
            request_id = rid

    entry = AuditLog(
        clinic_id=user.clinic_id if user else None,
        user_id=user.id if user else None,
        user_email=user.email if user else None,
        user_role=user.role if user else None,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        old_values=old_values,
        new_values=new_values,
        ip_address=ip,
        user_agent=user_agent,
        request_id=request_id,
        status=status,
        failure_reason=failure_reason,
        risk_score=risk_score,
        flags=flags or [],
        duration_ms=duration_ms,
    )
    db.add(entry)
    return entry


def log_login(db: Session, *, user: User, request: Request, success: bool, failure_reason: Optional[str] = None) -> None:
    log_event(
        db,
        action="auth.login",
        resource_type="user",
        resource_id=str(user.id),
        status="success" if success else "failure",
        request=request,
        user=user if success else None,
        failure_reason=failure_reason,
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
    )
