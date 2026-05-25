"""
Platform seed script — two responsibilities only:

1. seed_permissions()  — inserts RBAC Permission rows and RolePermission
                         assignments. Idempotent; safe to run multiple times.

2. main()              — creates the one super-admin account, reading
                         credentials from environment variables:
                             SUPER_ADMIN_EMAIL
                             SUPER_ADMIN_PASSWORD

Run from the backend/ directory:
    SUPER_ADMIN_EMAIL=admin@example.com SUPER_ADMIN_PASSWORD=secret python seed.py

ALL other data (clinics, doctors, patients, appointments, products, etc.)
is created exclusively by real users through the application API.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.rbac import Permission, RolePermission
import app.models  # noqa — register all SQLAlchemy mappers


# ── RBAC permission definitions ───────────────────────────────────────────────
# Tuples: (name, resource, action, scope, description)
ALL_PERMISSIONS = [
    # appointments
    ("appointments:create",      "appointments", "create", "clinic", "Create appointments within own clinic"),
    ("appointments:read",        "appointments", "read",   "clinic", "Read all appointments within own clinic"),
    ("appointments:read:own",    "appointments", "read",   "own",    "Read only own appointments"),
    ("appointments:update",      "appointments", "update", "clinic", "Update appointments within own clinic"),
    ("appointments:cancel",      "appointments", "cancel", "clinic", "Cancel any appointment within own clinic"),
    ("appointments:cancel:own",  "appointments", "cancel", "own",    "Cancel own appointments"),
    ("appointments:export",      "appointments", "export", "clinic", "Export appointment data from own clinic"),
    ("appointments:read:all",    "appointments", "read",   "all",    "Super admin reads all appointments"),
    # patients
    ("patients:read",            "patients",     "read",   "clinic", "Read patient list within own clinic"),
    ("patients:read:sensitive",  "patients",     "read",   "clinic", "Read sensitive medical history"),
    ("patients:update",          "patients",     "update", "clinic", "Update patient records within own clinic"),
    ("patients:export",          "patients",     "export", "clinic", "Export patient data from own clinic"),
    ("patients:read:all",        "patients",     "read",   "all",    "Super admin reads all patients"),
    # triage
    ("triage:read:own",          "triage",       "read",   "own",    "Read own triage sessions"),
    ("triage:read:clinic",       "triage",       "read",   "clinic", "Read all triage sessions within own clinic"),
    ("triage:read:all",          "triage",       "read",   "all",    "Super admin reads all triage sessions"),
    # orders
    ("orders:create",            "orders",       "create", "own",    "Create own orders"),
    ("orders:read:own",          "orders",       "read",   "own",    "Read own orders"),
    ("orders:read:clinic",       "orders",       "read",   "clinic", "Read all orders within own clinic"),
    ("orders:update:status",     "orders",       "update", "clinic", "Update order status within own clinic"),
    ("orders:export",            "orders",       "export", "clinic", "Export order data from own clinic"),
    # analytics
    ("analytics:read:basic",     "analytics",    "read",   "clinic", "Read basic analytics for own clinic"),
    ("analytics:read:advanced",  "analytics",    "read",   "clinic", "Read advanced analytics for own clinic"),
    ("analytics:read:all",       "analytics",    "read",   "all",    "Super admin reads all analytics"),
    # clinic management
    ("clinic:read",              "clinic",       "read",   "clinic", "Read own clinic settings"),
    ("clinic:update",            "clinic",       "update", "clinic", "Update own clinic settings"),
    ("clinic:manage:doctors",    "clinic",       "manage", "clinic", "Manage doctors within own clinic"),
    ("clinic:manage:all",        "clinic",       "manage", "all",    "Super admin manages all clinics"),
    # audit logs
    ("audit:read:own_clinic",    "audit",        "read",   "clinic", "Read audit logs for own clinic"),
    ("audit:read:all",           "audit",        "read",   "all",    "Super admin reads all audit logs"),
    # users
    ("users:read:own_clinic",    "users",        "read",   "clinic", "Read users within own clinic"),
    ("users:invite",             "users",        "invite", "clinic", "Invite users to own clinic"),
    ("users:deactivate",         "users",        "update", "clinic", "Deactivate users in own clinic"),
    ("users:manage:all",         "users",        "manage", "all",    "Super admin manages all users"),
    ("users:update:own",         "users",        "update", "own",    "Update own profile"),
    # products
    ("products:create",          "products",     "create", "clinic", "Create products within own clinic"),
    ("products:read",            "products",     "read",   "clinic", "Read products within own clinic"),
    ("products:update",          "products",     "update", "clinic", "Update products within own clinic"),
]

_ALL_NAMES = [p[0] for p in ALL_PERMISSIONS]

ROLE_PERMISSIONS: dict[str, list[str]] = {
    "super_admin": _ALL_NAMES,
    "clinic_admin": [
        "appointments:create", "appointments:read", "appointments:update",
        "appointments:cancel", "appointments:export",
        "patients:read", "patients:read:sensitive", "patients:update", "patients:export",
        "orders:read:clinic", "orders:update:status", "orders:export",
        "analytics:read:basic", "analytics:read:advanced",
        "clinic:read", "clinic:update", "clinic:manage:doctors",
        "audit:read:own_clinic",
        "users:read:own_clinic", "users:invite", "users:deactivate",
        "triage:read:clinic",
        "users:update:own",
    ],
    "clinic_doctor": [
        "appointments:create", "appointments:read", "appointments:update",
        "patients:read", "patients:read:sensitive", "patients:update",
        "orders:read:clinic",
        "analytics:read:basic",
        "triage:read:clinic",
        "users:update:own",
    ],
    "clinic_receptionist": [
        "appointments:create", "appointments:read", "appointments:update", "appointments:cancel",
        "patients:read", "patients:update",
        "orders:read:clinic",
        "analytics:read:basic",
        "triage:read:clinic",
        "users:update:own",
    ],
    "clinic_pharmacist": [
        "orders:read:clinic", "orders:update:status",
        "products:create", "products:read", "products:update",
        "patients:read",
        "users:update:own",
    ],
    "patient": [
        "appointments:create", "appointments:read:own", "appointments:cancel:own",
        "orders:create", "orders:read:own",
        "triage:read:own",
        "users:update:own",
    ],
}


def seed_permissions(db) -> dict[str, Permission]:
    """Insert all RBAC permissions and role assignments. Idempotent."""
    print("  Seeding permissions…")

    perm_map: dict[str, Permission] = {}
    for name, resource, action, scope, desc in ALL_PERMISSIONS:
        existing = db.query(Permission).filter(Permission.name == name).first()
        if existing:
            perm_map[name] = existing
        else:
            p = Permission(name=name, resource=resource, action=action, scope=scope, description=desc)
            db.add(p)
            perm_map[name] = p

    db.flush()

    for role, perm_names in ROLE_PERMISSIONS.items():
        for pname in perm_names:
            perm = perm_map.get(pname)
            if not perm:
                print(f"    WARNING: permission '{pname}' not found for role '{role}'")
                continue
            exists = (
                db.query(RolePermission)
                .filter(RolePermission.role == role, RolePermission.permission_id == perm.id)
                .first()
            )
            if not exists:
                db.add(RolePermission(role=role, permission_id=perm.id))

    db.flush()
    total_perms = len(perm_map)
    total_assigns = sum(len(v) for v in ROLE_PERMISSIONS.values())
    print(f"    {total_perms} permissions · {total_assigns} role assignments across {len(ROLE_PERMISSIONS)} roles")
    return perm_map


def main() -> None:
    email = os.environ.get("SUPER_ADMIN_EMAIL", "").strip()
    password = os.environ.get("SUPER_ADMIN_PASSWORD", "").strip()

    if not email or not password:
        print("\n[ERROR] Environment variables required:")
        print("  SUPER_ADMIN_EMAIL    — the super admin email address")
        print("  SUPER_ADMIN_PASSWORD — the super admin password (min 8 chars)")
        print("\nExample:")
        print("  SUPER_ADMIN_EMAIL=admin@yourplatform.com SUPER_ADMIN_PASSWORD=SecurePass123 python seed.py")
        sys.exit(1)

    if len(password) < 8:
        print("[ERROR] SUPER_ADMIN_PASSWORD must be at least 8 characters.")
        sys.exit(1)

    db = SessionLocal()
    try:
        seed_permissions(db)

        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"  Super admin already exists: {email} — skipping creation")
        else:
            admin = User(
                full_name="MedAssist Admin",
                email=email,
                password_hash=hash_password(password),
                role="super_admin",
                is_active=True,
                is_email_verified=True,
            )
            db.add(admin)
            print(f"  Super admin created: {email}")

        db.commit()

        print("\n" + "=" * 60)
        print("  SEED COMPLETE")
        print("=" * 60)
        print(f"  Super Admin: {email}")
        print("  All other data is created by real users via the API.")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\n[FAILED] {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
