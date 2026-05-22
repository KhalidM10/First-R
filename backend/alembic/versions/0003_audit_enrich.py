"""Add enriched fields to audit_logs for full traceability

Revision ID: 0003_audit_enrich
Revises: 0002_rbac_actions
Create Date: 2026-05-22
"""
from alembic import op

revision = "0003_audit_enrich"
down_revision = "0002_rbac_actions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Fields the spec requires that were missing from 0001
    op.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS browser        VARCHAR(100)")
    op.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS os             VARCHAR(100)")
    op.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS changed_fields TEXT[]")
    op.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS acting_as      VARCHAR(255)")
    op.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS api_endpoint   TEXT")
    op.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS http_method    VARCHAR(10)")
    op.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS clinic_name    VARCHAR(255)")

    # Index frequently-filtered columns
    op.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_risk_score ON audit_logs(risk_score)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_status     ON audit_logs(status)")


def downgrade() -> None:
    for col in ("browser", "os", "changed_fields", "acting_as", "api_endpoint", "http_method", "clinic_name"):
        op.execute(f"ALTER TABLE audit_logs DROP COLUMN IF EXISTS {col}")
    op.execute("DROP INDEX IF EXISTS ix_audit_logs_risk_score")
    op.execute("DROP INDEX IF EXISTS ix_audit_logs_status")
