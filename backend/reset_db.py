"""
Drop all tables and recreate the schema from scratch via Alembic migrations.

This runs `alembic upgrade head` programmatically so all RLS policies,
triggers, audit-immutability rules, and stored functions are applied —
identical to what runs in production.

Usage:
    cd backend
    python reset_db.py            # reset + leave empty
    python reset_db.py --seed     # reset + seed with Kenya test data
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def _get_db_user(database_url: str) -> str:
    """Extract username from postgres://user:pass@host/db connection string."""
    return database_url.split("://")[1].split(":")[0]


def reset(seed: bool = False) -> None:
    from sqlalchemy import text
    from alembic.config import Config
    from alembic import command

    from app.config import get_settings
    from app.database import engine

    settings = get_settings()
    db_user = _get_db_user(settings.database_url)

    # ── 1. Nuke the entire public schema (drops all tables, functions, policies)
    print("Dropping public schema CASCADE …")
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.execute(text(f"GRANT ALL ON SCHEMA public TO {db_user}"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
        conn.commit()

    # ── 2. Run every Alembic migration (RLS, triggers, audit rules, functions)
    print("Running Alembic migrations …")
    alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "alembic.ini"))
    alembic_cfg.set_main_option(
        "script_location",
        os.path.join(os.path.dirname(__file__), "alembic"),
    )
    command.upgrade(alembic_cfg, "head")

    print("Schema ready.")

    # ── 3. Optionally seed
    if seed:
        print("Seeding …")
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "seed",
            os.path.join(os.path.dirname(__file__), "seed.py"),
        )
        seed_mod = importlib.util.module_from_spec(spec)  # type: ignore[attr-defined]
        spec.loader.exec_module(seed_mod)  # type: ignore[union-attr]
        seed_mod.main()

    print("\nDone.")
    if not seed:
        print("Run:  python seed.py   to populate test data.")


if __name__ == "__main__":
    reset(seed="--seed" in sys.argv)
