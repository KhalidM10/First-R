"""Password history, TOTP backup codes, session enrichment

Revision ID: 0004_auth_security
Revises: 0003_audit_enrich
Create Date: 2026-05-22
"""
from alembic import op

revision = "0004_auth_security"
down_revision = "0003_audit_enrich"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Password history — prevent reuse of last 5 passwords
    op.execute("""
        CREATE TABLE password_history (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            hash        TEXT NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX ix_password_history_user_id ON password_history(user_id)")

    # TOTP backup codes (one-time use)
    op.execute("""
        CREATE TABLE totp_backup_codes (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            code_hash   TEXT NOT NULL,
            used        BOOLEAN NOT NULL DEFAULT FALSE,
            used_at     TIMESTAMPTZ,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX ix_totp_backup_codes_user_id ON totp_backup_codes(user_id)")

    # Enrich user_sessions with more fingerprint detail
    op.execute("ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS screen_resolution VARCHAR(20)")
    op.execute("ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS timezone VARCHAR(60)")
    op.execute("ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS language VARCHAR(20)")

    # CSRF nonce stored alongside the session
    op.execute("ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS csrf_token UUID DEFAULT gen_random_uuid()")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS totp_backup_codes")
    op.execute("DROP TABLE IF EXISTS password_history")
    for col in ("screen_resolution", "timezone", "language", "csrf_token"):
        op.execute(f"ALTER TABLE user_sessions DROP COLUMN IF EXISTS {col}")
