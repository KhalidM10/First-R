"""
Password validation service.

- Strength scoring (0-4)
- Common passwords check (top 100)
- Complexity enforcement
- Reuse prevention (last 5 hashes)
"""
import re
from typing import Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password

# Top 100 most common passwords — reject these regardless of complexity
_COMMON: frozenset[str] = frozenset([
    "password", "123456", "12345678", "1234567890", "password1", "password123",
    "123456789", "qwerty", "abc123", "letmein", "monkey", "dragon", "master",
    "iloveyou", "sunshine", "princess", "football", "shadow", "superman",
    "michael", "jessica", "welcome", "login", "admin", "passw0rd", "111111",
    "1234567", "12345", "1234", "123123", "654321", "666666", "000000",
    "qwerty123", "qwertyuiop", "asdfghjkl", "zxcvbnm", "1q2w3e4r", "1q2w3e",
    "q1w2e3r4", "superman1", "batman", "starwars", "trustno1", "hello123",
    "hello", "test", "test1234", "google", "facebook", "instagram", "twitter",
    "linkedin", "amazon", "microsoft", "apple1234", "samsung", "android",
    "windows", "office365", "medassist", "medassist1", "medassist123",
    "doctor", "hospital", "patient", "clinic", "health", "nairobi", "kenya",
    "safari", "jambo", "hakuna", "matata", "mzuri", "karibu",
])

_SPECIAL = set('!@#$%^&*()_+-=[]{}|;:,.<>?/~`"\'\\')


def score_password(password: str) -> int:
    """
    Returns 0 (very weak) → 4 (strong).

    0: too short or common
    1: meets minimum length only
    2: has uppercase + number
    3: has uppercase + number + special
    4: 12+ chars + all complexity requirements
    """
    if len(password) < 8 or password.lower() in _COMMON:
        return 0

    score = 1
    has_upper = bool(re.search(r'[A-Z]', password))
    has_lower = bool(re.search(r'[a-z]', password))
    has_digit = bool(re.search(r'\d', password))
    has_special = any(c in _SPECIAL for c in password)

    if has_upper and has_digit:
        score = 2
    if has_upper and has_digit and has_special:
        score = 3
    if score == 3 and len(password) >= 12:
        score = 4

    return score


def validate_password(password: str) -> list[str]:
    """
    Returns a list of unmet requirements. Empty = valid.
    """
    errors = []
    if len(password) < 8:
        errors.append("At least 8 characters required")
    if not re.search(r'[A-Z]', password):
        errors.append("At least one uppercase letter required")
    if not re.search(r'\d', password):
        errors.append("At least one number required")
    if not any(c in _SPECIAL for c in password):
        errors.append("At least one special character required (!@#$%^&*...)")
    if password.lower() in _COMMON:
        errors.append("This password is too common — choose something unique")
    return errors


def check_password_history(db: Session, user_id, new_password: str, keep_last: int = 5) -> bool:
    """
    Returns True if the password was recently used (should be rejected).
    """
    from app.models.auth_security import PasswordHistory
    recent = (
        db.query(PasswordHistory)
        .filter(PasswordHistory.user_id == user_id)
        .order_by(desc(PasswordHistory.created_at))
        .limit(keep_last)
        .all()
    )
    return any(verify_password(new_password, h.hash) for h in recent)


def record_password(db: Session, user_id, password: str) -> None:
    """Append current password hash to history. Prune entries > 10."""
    from app.models.auth_security import PasswordHistory
    entry = PasswordHistory(user_id=user_id, hash=hash_password(password))
    db.add(entry)
    # Prune old entries beyond 10
    old = (
        db.query(PasswordHistory)
        .filter(PasswordHistory.user_id == user_id)
        .order_by(desc(PasswordHistory.created_at))
        .offset(10)
        .all()
    )
    for o in old:
        db.delete(o)
