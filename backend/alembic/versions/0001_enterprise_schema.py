"""Enterprise schema — multi-tenant with RLS, audit, RBAC

Revision ID: 0001_enterprise
Revises:
Create Date: 2026-05-22
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, INET, JSONB, UUID

revision = "0001_enterprise"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Extensions ────────────────────────────────────────────────────────────
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # ── updated_at trigger function ───────────────────────────────────────────
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    """)

    # ═════════════════════════════════════════════════════════════════════════
    # CLINICS (tenants)
    # ═════════════════════════════════════════════════════════════════════════
    op.execute("""
        CREATE TABLE clinics (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id               UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
            name                    VARCHAR(255) NOT NULL,
            slug                    VARCHAR(100) UNIQUE NOT NULL,
            license_number          VARCHAR(100) UNIQUE,
            address                 TEXT NOT NULL,
            county                  VARCHAR(100) NOT NULL,
            sub_county              VARCHAR(100),
            latitude                NUMERIC(9,6),
            longitude               NUMERIC(9,6),
            phone                   VARCHAR(20) NOT NULL,
            email                   VARCHAR(255) UNIQUE NOT NULL,
            website                 VARCHAR(255),
            description             TEXT,
            logo_url                TEXT,
            cover_image_url         TEXT,
            specialties             TEXT[] DEFAULT '{}',
            operating_hours         JSONB NOT NULL DEFAULT '{}',
            is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
            is_active               BOOLEAN NOT NULL DEFAULT TRUE,
            subscription_plan       VARCHAR(50) NOT NULL DEFAULT 'basic'
                                        CHECK (subscription_plan IN ('basic','pro','enterprise')),
            subscription_started_at TIMESTAMPTZ,
            subscription_expires_at TIMESTAMPTZ,
            stripe_customer_id      VARCHAR(255),
            mpesa_paybill           VARCHAR(20),
            settings                JSONB DEFAULT '{}',
            created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX ix_clinics_county ON clinics(county)")
    op.execute("CREATE INDEX ix_clinics_slug ON clinics(slug)")
    op.execute("CREATE INDEX ix_clinics_is_active ON clinics(is_active)")
    op.execute("CREATE INDEX ix_clinics_subscription_plan ON clinics(subscription_plan)")
    op.execute("CREATE TRIGGER clinics_updated_at BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")

    # ═════════════════════════════════════════════════════════════════════════
    # USERS
    # ═════════════════════════════════════════════════════════════════════════
    op.execute("""
        CREATE TABLE users (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            clinic_id               UUID REFERENCES clinics(id) ON DELETE SET NULL,
            full_name               VARCHAR(255) NOT NULL,
            email                   VARCHAR(255) UNIQUE NOT NULL,
            phone                   VARCHAR(20) UNIQUE NOT NULL,
            password_hash           TEXT NOT NULL,
            role                    VARCHAR(50) NOT NULL
                                        CHECK (role IN ('super_admin','clinic_admin','clinic_doctor',
                                                        'clinic_receptionist','clinic_pharmacist','patient')),
            avatar_url              TEXT,
            county                  VARCHAR(100),
            date_of_birth           DATE,
            gender                  VARCHAR(20),
            blood_type              VARCHAR(5),
            allergies               TEXT[],
            emergency_contact       JSONB,
            is_active               BOOLEAN NOT NULL DEFAULT TRUE,
            is_email_verified       BOOLEAN NOT NULL DEFAULT FALSE,
            is_phone_verified       BOOLEAN NOT NULL DEFAULT FALSE,
            last_login_at           TIMESTAMPTZ,
            last_login_ip           INET,
            failed_login_attempts   INTEGER NOT NULL DEFAULT 0,
            locked_until            TIMESTAMPTZ,
            two_factor_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
            two_factor_secret       TEXT,
            password_reset_token    TEXT,
            password_reset_expires  TIMESTAMPTZ,
            email_verify_token      TEXT,
            created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX ix_users_email ON users(email)")
    op.execute("CREATE INDEX ix_users_phone ON users(phone)")
    op.execute("CREATE INDEX ix_users_role ON users(role)")
    op.execute("CREATE INDEX ix_users_clinic_id ON users(clinic_id)")
    op.execute("CREATE INDEX ix_users_is_active ON users(is_active)")
    op.execute("CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")

    # ═════════════════════════════════════════════════════════════════════════
    # RBAC
    # ═════════════════════════════════════════════════════════════════════════
    op.execute("""
        CREATE TABLE permissions (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name        VARCHAR(100) UNIQUE NOT NULL,
            resource    VARCHAR(100) NOT NULL,
            action      VARCHAR(50) NOT NULL
                            CHECK (action IN ('create','read','update','delete','export','import','approve','reject')),
            scope       VARCHAR(50) NOT NULL
                            CHECK (scope IN ('own','clinic','all')),
            description TEXT,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("""
        CREATE TABLE role_permissions (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            role          VARCHAR(50) NOT NULL,
            permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(role, permission_id)
        )
    """)
    op.execute("CREATE INDEX ix_role_permissions_role ON role_permissions(role)")
    op.execute("""
        CREATE TABLE user_permission_overrides (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
            granted       BOOLEAN NOT NULL,
            granted_by    UUID REFERENCES users(id),
            reason        TEXT,
            expires_at    TIMESTAMPTZ,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX ix_upo_user_id ON user_permission_overrides(user_id)")

    # ═════════════════════════════════════════════════════════════════════════
    # AUDIT LOG (immutable)
    # ═════════════════════════════════════════════════════════════════════════
    op.execute("""
        CREATE TABLE audit_logs (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_id      UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
            clinic_id     UUID REFERENCES clinics(id) ON DELETE SET NULL,
            user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
            user_email    VARCHAR(255),
            user_role     VARCHAR(50),
            action        VARCHAR(100) NOT NULL,
            resource_type VARCHAR(100) NOT NULL,
            resource_id   VARCHAR(255),
            old_values    JSONB,
            new_values    JSONB,
            ip_address    INET NOT NULL,
            user_agent    TEXT,
            device_type   VARCHAR(50),
            country       VARCHAR(100),
            city          VARCHAR(100),
            request_id    UUID NOT NULL,
            session_id    UUID,
            status        VARCHAR(20) NOT NULL
                              CHECK (status IN ('success','failure','blocked')),
            failure_reason TEXT,
            risk_score    INTEGER NOT NULL DEFAULT 0,
            flags         TEXT[] DEFAULT '{}',
            duration_ms   INTEGER,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX ix_audit_logs_clinic_id ON audit_logs(clinic_id)")
    op.execute("CREATE INDEX ix_audit_logs_user_id ON audit_logs(user_id)")
    op.execute("CREATE INDEX ix_audit_logs_action ON audit_logs(action)")
    op.execute("CREATE INDEX ix_audit_logs_resource_type ON audit_logs(resource_type)")
    op.execute("CREATE INDEX ix_audit_logs_created_at ON audit_logs(created_at)")
    op.execute("CREATE INDEX ix_audit_logs_request_id ON audit_logs(request_id)")
    # Make truly immutable
    op.execute("CREATE RULE audit_log_no_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING")
    op.execute("CREATE RULE audit_log_no_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING")

    # ═════════════════════════════════════════════════════════════════════════
    # USER SESSIONS
    # ═════════════════════════════════════════════════════════════════════════
    op.execute("""
        CREATE TABLE user_sessions (
            id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            session_token      TEXT UNIQUE NOT NULL,
            refresh_token      TEXT UNIQUE NOT NULL,
            ip_address         INET NOT NULL,
            user_agent         TEXT,
            device_fingerprint TEXT,
            device_type        VARCHAR(50),
            browser            VARCHAR(100),
            os                 VARCHAR(100),
            country            VARCHAR(100),
            city               VARCHAR(100),
            is_active          BOOLEAN NOT NULL DEFAULT TRUE,
            last_active_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at         TIMESTAMPTZ NOT NULL,
            created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX ix_user_sessions_user_id ON user_sessions(user_id)")
    op.execute("CREATE INDEX ix_user_sessions_session_token ON user_sessions(session_token)")
    op.execute("CREATE INDEX ix_user_sessions_is_active ON user_sessions(is_active)")
    op.execute("CREATE INDEX ix_user_sessions_expires_at ON user_sessions(expires_at)")

    # ═════════════════════════════════════════════════════════════════════════
    # DOCTORS
    # ═════════════════════════════════════════════════════════════════════════
    op.execute("""
        CREATE TABLE doctors (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            clinic_id               UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
            user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
            full_name               VARCHAR(255) NOT NULL,
            specialty               VARCHAR(100) NOT NULL,
            sub_specialty           VARCHAR(100),
            qualification           VARCHAR(255) NOT NULL,
            license_number          VARCHAR(100) UNIQUE,
            bio                     TEXT,
            photo_url               TEXT,
            consultation_fee_kes    NUMERIC(10,2) NOT NULL,
            available_days          INTEGER[] NOT NULL,
            slot_duration_minutes   INTEGER NOT NULL DEFAULT 30,
            max_daily_appointments  INTEGER NOT NULL DEFAULT 20,
            is_active               BOOLEAN NOT NULL DEFAULT TRUE,
            rating                  NUMERIC(3,2) NOT NULL DEFAULT 0.00,
            total_reviews           INTEGER NOT NULL DEFAULT 0,
            created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX ix_doctors_clinic_id ON doctors(clinic_id)")
    op.execute("CREATE INDEX ix_doctors_specialty ON doctors(specialty)")
    op.execute("CREATE INDEX ix_doctors_is_active ON doctors(is_active)")
    op.execute("CREATE TRIGGER doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")

    # ═════════════════════════════════════════════════════════════════════════
    # TRIAGE SESSIONS
    # ═════════════════════════════════════════════════════════════════════════
    op.execute("""
        CREATE TABLE triage_sessions (
            id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_token            UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
            user_id                  UUID REFERENCES users(id) ON DELETE SET NULL,
            symptoms                 JSONB NOT NULL,
            severity_level           VARCHAR(20) NOT NULL
                                         CHECK (severity_level IN ('mild','moderate','urgent','emergency')),
            confidence_score         NUMERIC(4,3),
            matched_patterns         JSONB,
            recommendations          JSONB NOT NULL,
            recommended_action       VARCHAR(50),
            patient_age              INTEGER,
            patient_gender           VARCHAR(20),
            pre_existing_conditions  TEXT[],
            county                   VARCHAR(100),
            led_to_appointment       BOOLEAN NOT NULL DEFAULT FALSE,
            appointment_id           UUID,
            did_visit_doctor         BOOLEAN,
            actual_diagnosis         TEXT,
            feedback_rating          INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
            feedback_text            TEXT,
            session_duration_seconds INTEGER,
            device_type              VARCHAR(50),
            ip_address               INET,
            created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX ix_triage_sessions_user_id ON triage_sessions(user_id)")
    op.execute("CREATE INDEX ix_triage_sessions_severity_level ON triage_sessions(severity_level)")
    op.execute("CREATE INDEX ix_triage_sessions_created_at ON triage_sessions(created_at)")
    op.execute("CREATE INDEX ix_triage_sessions_county ON triage_sessions(county)")

    # ═════════════════════════════════════════════════════════════════════════
    # APPOINTMENTS
    # ═════════════════════════════════════════════════════════════════════════
    op.execute("""
        CREATE TABLE appointments (
            id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            clinic_id             UUID NOT NULL REFERENCES clinics(id),
            patient_id            UUID NOT NULL REFERENCES users(id),
            doctor_id             UUID NOT NULL REFERENCES doctors(id),
            triage_session_id     UUID REFERENCES triage_sessions(id),
            appointment_date      DATE NOT NULL,
            appointment_time      VARCHAR(8) NOT NULL,
            duration_minutes      INTEGER NOT NULL DEFAULT 30,
            status                VARCHAR(50) NOT NULL DEFAULT 'pending'
                                      CHECK (status IN ('pending','confirmed','in_progress',
                                                        'completed','cancelled','no_show','rescheduled')),
            reason                TEXT NOT NULL,
            notes                 TEXT,
            doctor_notes          TEXT,
            prescription          JSONB,
            follow_up_date        DATE,
            payment_status        VARCHAR(50) NOT NULL DEFAULT 'pending'
                                      CHECK (payment_status IN ('pending','paid','refunded','waived')),
            amount_kes            NUMERIC(10,2),
            payment_method        VARCHAR(50),
            mpesa_transaction_id  VARCHAR(100),
            mpesa_receipt_number  VARCHAR(100),
            reminder_sent_24h     BOOLEAN NOT NULL DEFAULT FALSE,
            reminder_sent_2h      BOOLEAN NOT NULL DEFAULT FALSE,
            cancelled_by          UUID REFERENCES users(id),
            cancellation_reason   TEXT,
            cancelled_at          TIMESTAMPTZ,
            created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX ix_appointments_clinic_id ON appointments(clinic_id)")
    op.execute("CREATE INDEX ix_appointments_patient_id ON appointments(patient_id)")
    op.execute("CREATE INDEX ix_appointments_doctor_id ON appointments(doctor_id)")
    op.execute("CREATE INDEX ix_appointments_appointment_date ON appointments(appointment_date)")
    op.execute("CREATE INDEX ix_appointments_status ON appointments(status)")
    op.execute("CREATE INDEX ix_appointments_created_at ON appointments(created_at)")
    op.execute("CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")

    # Add cross-reference FK (triage ↔ appointment)
    op.execute("""
        ALTER TABLE triage_sessions
        ADD CONSTRAINT fk_triage_appointment
        FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    """)

    # ═════════════════════════════════════════════════════════════════════════
    # SYMPTOM LOGS
    # ═════════════════════════════════════════════════════════════════════════
    op.execute("""
        CREATE TABLE symptom_logs (
            id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            triage_session_id  UUID NOT NULL REFERENCES triage_sessions(id) ON DELETE CASCADE,
            symptom_name       VARCHAR(100) NOT NULL,
            body_part          VARCHAR(100),
            duration_days      INTEGER,
            severity_score     INTEGER CHECK (severity_score BETWEEN 1 AND 10),
            onset_type         VARCHAR(50),
            created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX ix_symptom_logs_triage_session_id ON symptom_logs(triage_session_id)")
    op.execute("CREATE INDEX ix_symptom_logs_symptom_name ON symptom_logs(symptom_name)")

    # ═════════════════════════════════════════════════════════════════════════
    # PRODUCTS
    # ═════════════════════════════════════════════════════════════════════════
    op.execute("""
        CREATE TABLE products (
            id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            clinic_id             UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
            name                  VARCHAR(255) NOT NULL,
            generic_name          VARCHAR(255),
            brand                 VARCHAR(100),
            category              VARCHAR(100) NOT NULL,
            description           TEXT,
            dosage_info           TEXT,
            side_effects          TEXT,
            contraindications     TEXT,
            price_kes             NUMERIC(10,2) NOT NULL,
            stock_quantity        INTEGER NOT NULL DEFAULT 0,
            low_stock_threshold   INTEGER NOT NULL DEFAULT 10,
            requires_prescription BOOLEAN NOT NULL DEFAULT FALSE,
            image_url             TEXT,
            barcode               VARCHAR(100),
            expiry_date           DATE,
            manufacturer          VARCHAR(255),
            is_active             BOOLEAN NOT NULL DEFAULT TRUE,
            created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX ix_products_clinic_id ON products(clinic_id)")
    op.execute("CREATE INDEX ix_products_category ON products(category)")
    op.execute("CREATE INDEX ix_products_is_active ON products(is_active)")
    op.execute("CREATE INDEX ix_products_name ON products(name)")
    op.execute("CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")

    # ═════════════════════════════════════════════════════════════════════════
    # ORDERS
    # ═════════════════════════════════════════════════════════════════════════
    op.execute("""
        CREATE TABLE orders (
            id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_number         VARCHAR(20) UNIQUE NOT NULL,
            clinic_id            UUID NOT NULL REFERENCES clinics(id),
            patient_id           UUID NOT NULL REFERENCES users(id),
            items                JSONB NOT NULL,
            subtotal_kes         NUMERIC(10,2) NOT NULL,
            delivery_fee_kes     NUMERIC(10,2) NOT NULL DEFAULT 0,
            total_kes            NUMERIC(10,2) NOT NULL,
            status               VARCHAR(50) NOT NULL DEFAULT 'pending'
                                     CHECK (status IN ('pending','confirmed','processing','ready',
                                                       'out_for_delivery','delivered','cancelled','refunded')),
            delivery_method      VARCHAR(20) CHECK (delivery_method IN ('pickup','delivery')),
            delivery_address     JSONB,
            payment_method       VARCHAR(50),
            payment_status       VARCHAR(50) NOT NULL DEFAULT 'pending'
                                     CHECK (payment_status IN ('pending','paid','failed','refunded')),
            mpesa_transaction_id VARCHAR(100),
            mpesa_receipt_number VARCHAR(100),
            notes                TEXT,
            estimated_ready_at   TIMESTAMPTZ,
            delivered_at         TIMESTAMPTZ,
            created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX ix_orders_clinic_id ON orders(clinic_id)")
    op.execute("CREATE INDEX ix_orders_patient_id ON orders(patient_id)")
    op.execute("CREATE INDEX ix_orders_status ON orders(status)")
    op.execute("CREATE INDEX ix_orders_created_at ON orders(created_at)")
    op.execute("CREATE INDEX ix_orders_order_number ON orders(order_number)")
    op.execute("CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")

    # ═════════════════════════════════════════════════════════════════════════
    # REVIEWS
    # ═════════════════════════════════════════════════════════════════════════
    op.execute("""
        CREATE TABLE reviews (
            id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            clinic_id      UUID NOT NULL REFERENCES clinics(id),
            patient_id     UUID NOT NULL REFERENCES users(id),
            doctor_id      UUID REFERENCES doctors(id),
            appointment_id UUID UNIQUE REFERENCES appointments(id),
            rating         INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
            title          VARCHAR(255),
            body           TEXT,
            is_verified    BOOLEAN NOT NULL DEFAULT FALSE,
            is_published   BOOLEAN NOT NULL DEFAULT TRUE,
            response       TEXT,
            response_at    TIMESTAMPTZ,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX ix_reviews_clinic_id ON reviews(clinic_id)")
    op.execute("CREATE INDEX ix_reviews_patient_id ON reviews(patient_id)")
    op.execute("CREATE INDEX ix_reviews_doctor_id ON reviews(doctor_id)")
    op.execute("CREATE INDEX ix_reviews_is_published ON reviews(is_published)")

    # ═════════════════════════════════════════════════════════════════════════
    # NOTIFICATIONS
    # ═════════════════════════════════════════════════════════════════════════
    op.execute("""
        CREATE TABLE notifications (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            clinic_id  UUID REFERENCES clinics(id),
            type       VARCHAR(100) NOT NULL,
            title      VARCHAR(255) NOT NULL,
            body       TEXT NOT NULL,
            data       JSONB DEFAULT '{}',
            channel    TEXT[] NOT NULL DEFAULT '{in_app}',
            is_read    BOOLEAN NOT NULL DEFAULT FALSE,
            read_at    TIMESTAMPTZ,
            sent_at    TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX ix_notifications_user_id ON notifications(user_id)")
    op.execute("CREATE INDEX ix_notifications_is_read ON notifications(is_read)")
    op.execute("CREATE INDEX ix_notifications_created_at ON notifications(created_at)")
    op.execute("CREATE INDEX ix_notifications_type ON notifications(type)")

    # ═════════════════════════════════════════════════════════════════════════
    # ANALYTICS SNAPSHOTS
    # ═════════════════════════════════════════════════════════════════════════
    op.execute("""
        CREATE TABLE analytics_snapshots (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            clinic_id     UUID NOT NULL REFERENCES clinics(id),
            snapshot_date DATE NOT NULL,
            metrics       JSONB NOT NULL,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(clinic_id, snapshot_date)
        )
    """)
    op.execute("CREATE INDEX ix_analytics_snapshots_clinic_id ON analytics_snapshots(clinic_id)")
    op.execute("CREATE INDEX ix_analytics_snapshots_snapshot_date ON analytics_snapshots(snapshot_date)")

    # ═════════════════════════════════════════════════════════════════════════
    # ROW LEVEL SECURITY
    # ═════════════════════════════════════════════════════════════════════════
    rls_tables = ["doctors", "appointments", "products", "orders", "reviews", "analytics_snapshots", "notifications"]

    for table in rls_tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
        op.execute(f"""
            CREATE POLICY clinic_isolation ON {table}
            USING (
                clinic_id::TEXT = current_setting('app.current_clinic_id', true)
                OR current_setting('app.is_super_admin', true) = 'true'
            )
        """)

    # Notifications use user_id, not clinic_id
    op.execute("ALTER TABLE notifications DISABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY user_isolation ON notifications
        USING (
            user_id::TEXT IN (
                SELECT id::TEXT FROM users
                WHERE id::TEXT = current_setting('app.current_user_id', true)
            )
            OR current_setting('app.is_super_admin', true) = 'true'
        )
    """)
    op.execute("ALTER TABLE notifications ENABLE ROW LEVEL SECURITY")

    # ═════════════════════════════════════════════════════════════════════════
    # ANALYTICS FUNCTION
    # ═════════════════════════════════════════════════════════════════════════
    op.execute("""
        CREATE OR REPLACE FUNCTION compute_clinic_daily_snapshot(p_clinic_id UUID, p_date DATE)
        RETURNS JSONB AS $$
        DECLARE
            result JSONB;
        BEGIN
            SELECT jsonb_build_object(
                'total_appointments',     COUNT(*),
                'completed_appointments', COUNT(*) FILTER (WHERE status = 'completed'),
                'cancelled_appointments', COUNT(*) FILTER (WHERE status = 'cancelled'),
                'no_show_appointments',   COUNT(*) FILTER (WHERE status = 'no_show'),
                'total_revenue_kes',      COALESCE(SUM(amount_kes) FILTER (WHERE payment_status = 'paid'), 0),
                'new_patients',           COUNT(DISTINCT patient_id),
                'avg_fee_kes',            COALESCE(AVG(amount_kes) FILTER (WHERE payment_status = 'paid'), 0)
            )
            INTO result
            FROM appointments
            WHERE clinic_id = p_clinic_id
              AND appointment_date = p_date;

            RETURN COALESCE(result, '{}');
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    """)


def downgrade() -> None:
    # Drop in reverse dependency order
    op.execute("DROP FUNCTION IF EXISTS compute_clinic_daily_snapshot(UUID, DATE)")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE")

    for table in ["analytics_snapshots", "notifications", "reviews",
                  "orders", "products", "symptom_logs", "appointments",
                  "triage_sessions", "doctors", "user_sessions",
                  "audit_logs", "user_permission_overrides",
                  "role_permissions", "permissions", "users", "clinics"]:
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
