"""
TOTP (Time-based One-Time Password) service.

- Google Authenticator compatible (RFC 6238)
- 8 single-use backup codes
- Backup codes are stored as bcrypt hashes
"""
import secrets
import string
from typing import Optional

import pyotp

from app.core.security import hash_password, verify_password


def generate_totp_secret() -> str:
    """Generate a new TOTP secret key (base32 encoded)."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str, issuer: str = "MedAssist AI") -> str:
    """Return the otpauth:// URI for QR code generation."""
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=issuer)


def verify_totp(secret: str, code: str, valid_window: int = 1) -> bool:
    """
    Verify a TOTP code. Accepts one period before/after for clock drift.
    """
    if not secret or not code:
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(code.strip(), valid_window=valid_window)


def generate_backup_codes(count: int = 8) -> tuple[list[str], list[str]]:
    """
    Generate backup codes.
    Returns (plaintext_codes, hashed_codes).
    Caller stores hashes, shows plaintext to user once.
    """
    chars = string.ascii_uppercase + string.digits
    codes = ["".join(secrets.choice(chars) for _ in range(8)) for _ in range(count)]
    hashes = [hash_password(c) for c in codes]
    return codes, hashes


def verify_and_consume_backup_code(
    db,
    user_id,
    submitted_code: str,
) -> bool:
    """
    Check submitted code against stored hashes. Marks matching code as used.
    Returns True if a valid unused code was found.
    """
    from app.models.auth_security import TOTPBackupCode
    active = (
        db.query(TOTPBackupCode)
        .filter(
            TOTPBackupCode.user_id == user_id,
            TOTPBackupCode.used == False,
        )
        .all()
    )
    for backup in active:
        if verify_password(submitted_code.upper().strip(), backup.code_hash):
            from datetime import datetime
            backup.used = True
            backup.used_at = datetime.utcnow()
            return True
    return False


def setup_2fa(db, user, email: str) -> tuple[str, str, list[str]]:
    """
    Enable 2FA for a user.
    Returns (secret, totp_uri, plaintext_backup_codes).
    """
    from app.models.auth_security import TOTPBackupCode
    from datetime import datetime

    secret = generate_totp_secret()
    uri = get_totp_uri(secret, email)
    codes, hashes = generate_backup_codes()

    # Invalidate old backup codes
    db.query(TOTPBackupCode).filter(TOTPBackupCode.user_id == user.id).delete()

    for h in hashes:
        db.add(TOTPBackupCode(user_id=user.id, code_hash=h))

    user.two_factor_secret = secret
    user.two_factor_enabled = True

    return secret, uri, codes
