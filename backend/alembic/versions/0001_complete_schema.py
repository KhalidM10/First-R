"""Complete MVP schema — all 8 tables

Revision ID: 0001
Revises:
Create Date: 2026-05-18
"""

from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Drop legacy tables/types from previous schema (clean slate) ──────────
    op.execute("""
        DROP TABLE IF EXISTS symptom_logs        CASCADE;
        DROP TABLE IF EXISTS clinic_analytics    CASCADE;
        DROP TABLE IF EXISTS medicine_orders     CASCADE;
        DROP TABLE IF EXISTS triage_sessions     CASCADE;
        DROP TABLE IF EXISTS appointments        CASCADE;
        DROP TABLE IF EXISTS doctors             CASCADE;
        DROP TABLE IF EXISTS clinics             CASCADE;
        DROP TABLE IF EXISTS patients            CASCADE;
        DROP TABLE IF EXISTS users               CASCADE;

        DROP TYPE IF EXISTS userrole             CASCADE;
        DROP TYPE IF EXISTS subscriptionplan     CASCADE;
        DROP TYPE IF EXISTS appointmentstatus    CASCADE;
        DROP TYPE IF EXISTS severitylevel        CASCADE;
        DROP TYPE IF EXISTS recommendedaction    CASCADE;
        DROP TYPE IF EXISTS orderstatus          CASCADE;
        DROP TYPE IF EXISTS deliverymethod       CASCADE;
        DROP TYPE IF EXISTS paymentmethod        CASCADE;
    """)

    # ── 1. users ─────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("patient", "clinic_admin", "super_admin", name="userrole"),
            nullable=False,
            server_default="patient",
        ),
        sa.Column("location", sa.String(100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_phone", "users", ["phone"], unique=True)
    op.create_index("ix_users_role", "users", ["role"])
    op.create_index("ix_users_location", "users", ["location"])

    # ── 2. clinics ───────────────────────────────────────────────────────────
    op.create_table(
        "clinics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("address", sa.String(500), nullable=False),
        sa.Column("county", sa.String(100), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("license_number", sa.String(100), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "subscription_plan",
            sa.Enum("basic", "pro", "enterprise", name="subscriptionplan"),
            nullable=False,
            server_default="basic",
        ),
        sa.Column("subscription_expires_at", sa.DateTime(), nullable=True),
        sa.Column("operating_hours", postgresql.JSONB(), nullable=True, server_default="{}"),
        sa.Column("specialties", postgresql.JSONB(), nullable=True, server_default="[]"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_clinics_county", "clinics", ["county"])
    op.create_index("ix_clinics_name", "clinics", ["name"])
    op.create_index("ix_clinics_is_verified", "clinics", ["is_verified"])
    op.create_index("ix_clinics_subscription_plan", "clinics", ["subscription_plan"])

    # ── 3. doctors ───────────────────────────────────────────────────────────
    op.create_table(
        "doctors",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("clinic_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("specialty", sa.String(100), nullable=False),
        sa.Column("qualification", sa.String(255), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("available_days", postgresql.JSONB(), nullable=True, server_default="[]"),
        sa.Column("consultation_fee_kes", sa.Float(), nullable=True, server_default="1500"),
        sa.Column("photo_url", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_doctors_clinic_id", "doctors", ["clinic_id"])
    op.create_index("ix_doctors_specialty", "doctors", ["specialty"])
    op.create_index("ix_doctors_is_active", "doctors", ["is_active"])

    # ── 4. appointments ──────────────────────────────────────────────────────
    op.create_table(
        "appointments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("doctors.id"), nullable=True),
        sa.Column("clinic_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("appointment_date", sa.Date(), nullable=False),
        sa.Column("appointment_time", sa.Time(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "confirmed", "completed", "cancelled", name="appointmentstatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("payment_status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("amount_kes", sa.Float(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_appointments_patient_id", "appointments", ["patient_id"])
    op.create_index("ix_appointments_clinic_id", "appointments", ["clinic_id"])
    op.create_index("ix_appointments_doctor_id", "appointments", ["doctor_id"])
    op.create_index("ix_appointments_date", "appointments", ["appointment_date"])
    op.create_index("ix_appointments_status", "appointments", ["status"])
    op.create_index("ix_appointments_created_at", "appointments", ["created_at"])

    # ── 5. triage_sessions ───────────────────────────────────────────────────
    op.create_table(
        "triage_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("symptoms", postgresql.JSONB(), nullable=True, server_default="[]"),
        sa.Column(
            "severity_level",
            sa.Enum("mild", "moderate", "urgent", name="severitylevel"),
            nullable=True,
        ),
        sa.Column("recommendations", postgresql.JSONB(), nullable=True, server_default="[]"),
        sa.Column(
            "recommended_action",
            sa.Enum("rest_at_home", "visit_clinic", "emergency", name="recommendedaction"),
            nullable=True,
        ),
        sa.Column("user_age", sa.Integer(), nullable=True),
        sa.Column("user_gender", sa.String(10), nullable=True),
        sa.Column("county", sa.String(100), nullable=True),
        sa.Column("did_visit_doctor", sa.Boolean(), nullable=True),
        sa.Column("session_duration_seconds", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_triage_sessions_user_id", "triage_sessions", ["user_id"])
    op.create_index("ix_triage_sessions_created_at", "triage_sessions", ["created_at"])
    op.create_index("ix_triage_sessions_severity_level", "triage_sessions", ["severity_level"])
    op.create_index("ix_triage_sessions_county", "triage_sessions", ["county"])

    # ── 6. symptom_logs ──────────────────────────────────────────────────────
    op.create_table(
        "symptom_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "triage_session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("triage_sessions.id"),
            nullable=False,
        ),
        sa.Column("symptom_name", sa.String(255), nullable=False),
        sa.Column("duration_days", sa.Integer(), nullable=True),
        sa.Column("severity_score", sa.Integer(), nullable=True),
        sa.Column("body_part", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_symptom_logs_session_id", "symptom_logs", ["triage_session_id"])
    op.create_index("ix_symptom_logs_symptom_name", "symptom_logs", ["symptom_name"])

    # ── 7. medicine_orders ───────────────────────────────────────────────────
    op.create_table(
        "medicine_orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("clinic_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("clinics.id"), nullable=True),
        sa.Column("items", postgresql.JSONB(), nullable=True, server_default="[]"),
        sa.Column("total_amount_kes", sa.Float(), nullable=False, server_default="0"),
        sa.Column(
            "status",
            sa.Enum("pending", "processing", "ready", "delivered", name="orderstatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "delivery_method",
            sa.Enum("pickup", "delivery", name="deliverymethod"),
            nullable=False,
            server_default="pickup",
        ),
        sa.Column("delivery_address", sa.String(500), nullable=True),
        sa.Column(
            "payment_method",
            sa.Enum("mpesa", "cash", name="paymentmethod"),
            nullable=False,
            server_default="mpesa",
        ),
        sa.Column("mpesa_transaction_id", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_medicine_orders_patient_id", "medicine_orders", ["patient_id"])
    op.create_index("ix_medicine_orders_clinic_id", "medicine_orders", ["clinic_id"])
    op.create_index("ix_medicine_orders_status", "medicine_orders", ["status"])
    op.create_index("ix_medicine_orders_created_at", "medicine_orders", ["created_at"])

    # ── 8. clinic_analytics ──────────────────────────────────────────────────
    op.create_table(
        "clinic_analytics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("clinic_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("clinics.id"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("total_appointments", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed_appointments", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cancelled_appointments", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_revenue_kes", sa.Float(), nullable=False, server_default="0"),
        sa.Column("new_patients", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("returning_patients", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("clinic_id", "date", name="uq_clinic_analytics_clinic_date"),
    )
    op.create_index("ix_clinic_analytics_clinic_id", "clinic_analytics", ["clinic_id"])
    op.create_index("ix_clinic_analytics_date", "clinic_analytics", ["date"])


def downgrade() -> None:
    op.execute("""
        DROP TABLE IF EXISTS clinic_analytics  CASCADE;
        DROP TABLE IF EXISTS medicine_orders   CASCADE;
        DROP TABLE IF EXISTS symptom_logs      CASCADE;
        DROP TABLE IF EXISTS triage_sessions   CASCADE;
        DROP TABLE IF EXISTS appointments      CASCADE;
        DROP TABLE IF EXISTS doctors           CASCADE;
        DROP TABLE IF EXISTS clinics           CASCADE;
        DROP TABLE IF EXISTS users             CASCADE;

        DROP TYPE IF EXISTS userrole           CASCADE;
        DROP TYPE IF EXISTS subscriptionplan   CASCADE;
        DROP TYPE IF EXISTS appointmentstatus  CASCADE;
        DROP TYPE IF EXISTS severitylevel      CASCADE;
        DROP TYPE IF EXISTS recommendedaction  CASCADE;
        DROP TYPE IF EXISTS orderstatus        CASCADE;
        DROP TYPE IF EXISTS deliverymethod     CASCADE;
        DROP TYPE IF EXISTS paymentmethod      CASCADE;
    """)
