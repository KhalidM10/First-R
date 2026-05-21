# Convenience re-export so both `app.api.deps` and `app.core.deps` resolve.
from app.core.deps import get_db, get_current_user, get_optional_user, require_role

__all__ = ["get_db", "get_current_user", "get_optional_user", "require_role"]
