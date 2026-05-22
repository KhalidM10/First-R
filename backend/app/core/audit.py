"""
Thin compatibility wrappers — delegate to app.services.audit_service.

All new code should import from audit_service directly.
These wrappers exist so existing callers don't need to change.
"""
from typing import Optional

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.user import User
from app.services.audit_service import (  # noqa: F401 — re-exported
    log_event,
    log_auth,
    log_data_access,
    log_data_change,
    log_permission_event,
)


def log_login(
    db: Session,
    *,
    user: User,
    request: Request,
    success: bool,
    failure_reason: Optional[str] = None,
    failed_attempts_before: int = 0,
) -> None:
    log_auth(
        db,
        action="auth.login",
        user=user,
        request=request,
        success=success,
        failure_reason=failure_reason,
        failed_attempts_before=failed_attempts_before,
    )
