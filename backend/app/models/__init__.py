# Import order matters — tables must be created in dependency order.
# All imports here ensure SQLAlchemy mapper sees every model.

from app.models.clinic import Clinic  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.doctor import Doctor  # noqa: F401
from app.models.rbac import Permission, RolePermission, UserPermissionOverride  # noqa: F401
from app.models.audit import AuditLog, UserSession  # noqa: F401
from app.models.triage import TriageSession, SymptomLog  # noqa: F401
from app.models.appointment import Appointment  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.order import Order  # noqa: F401
from app.models.review import Review  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.analytics import AnalyticsSnapshot  # noqa: F401
from app.models.auth_security import PasswordHistory, TOTPBackupCode  # noqa: F401
