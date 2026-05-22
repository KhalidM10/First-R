"""Widen permission action constraint and add products to RLS

Revision ID: 0002_rbac_actions
Revises: 0001_enterprise
Create Date: 2026-05-22
"""
from alembic import op

revision = "0002_rbac_actions"
down_revision = "0001_enterprise"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the narrow action constraint and replace with one that covers all
    # RBAC-defined actions (cancel, manage, invite added alongside originals).
    op.execute("ALTER TABLE permissions DROP CONSTRAINT IF EXISTS permissions_action_check")
    op.execute("""
        ALTER TABLE permissions ADD CONSTRAINT permissions_action_check
        CHECK (action IN (
            'create','read','update','delete','export','import',
            'approve','reject','cancel','manage','invite'
        ))
    """)

    # Add products table RLS (missed in 0001)
    op.execute("ALTER TABLE products ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE products FORCE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY products_clinic_isolation ON products
        USING (
            clinic_id::TEXT = current_setting('app.current_clinic_id', true)
            OR current_setting('app.is_super_admin', true) = 'true'
        )
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE permissions DROP CONSTRAINT IF EXISTS permissions_action_check")
    op.execute("""
        ALTER TABLE permissions ADD CONSTRAINT permissions_action_check
        CHECK (action IN ('create','read','update','delete','export','import','approve','reject'))
    """)
    op.execute("DROP POLICY IF EXISTS products_clinic_isolation ON products")
