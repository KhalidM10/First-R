"""
Drop all tables and recreate the schema from scratch.
Use this during development after model changes.

Usage:
    python reset_db.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine, Base
import app.models  # noqa — registers all ORM models


def reset():
    print("Dropping all tables (CASCADE)...")
    from app.config import get_settings
    db_user = get_settings().database_url.split("//")[1].split(":")[0]
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.execute(text(f"GRANT ALL ON SCHEMA public TO {db_user}"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
        conn.commit()
    print("Creating new schema...")
    Base.metadata.create_all(bind=engine)
    print("Done. Now run: python seed.py")


if __name__ == "__main__":
    reset()
