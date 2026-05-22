"""
Row Level Security context management.

Every request that touches clinic-scoped data must set the RLS context
so PostgreSQL policies can enforce data isolation at the database level.

Usage in route dependencies:
    db: Session = Depends(get_rls_db)
"""
import uuid
from typing import Generator, Optional

from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import SessionLocal, get_db
from app.core.deps import get_current_user, get_optional_user
from app.models.user import User


def _apply_rls(db: Session, user: Optional[User]) -> None:
    """Write app.* settings into the current PostgreSQL session."""
    if user is None:
        # Anonymous — no clinic context, not super admin
        db.execute(text("SELECT set_config('app.is_super_admin', 'false', false)"))
        db.execute(text("SELECT set_config('app.current_clinic_id', '', false)"))
        return

    is_super = user.role == "super_admin"
    db.execute(
        text("SELECT set_config('app.is_super_admin', :val, false)"),
        {"val": "true" if is_super else "false"},
    )
    db.execute(
        text("SELECT set_config('app.current_clinic_id', :val, false)"),
        {"val": str(user.clinic_id) if user.clinic_id else ""},
    )


def get_rls_db(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Generator[Session, None, None]:
    """DB session with RLS context set — requires authenticated user."""
    _apply_rls(db, current_user)
    yield db


def get_optional_rls_db(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
) -> Generator[Session, None, None]:
    """DB session with RLS context set — allows anonymous access."""
    _apply_rls(db, current_user)
    yield db
