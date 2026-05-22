import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PermissionOut(BaseModel):
    id: uuid.UUID
    name: str
    resource: str
    action: str
    scope: str
    description: Optional[str]

    model_config = {"from_attributes": True}


class RolePermissionOut(BaseModel):
    role: str
    permission: PermissionOut

    model_config = {"from_attributes": True}


class OverrideCreate(BaseModel):
    user_id: uuid.UUID
    permission_name: str
    granted: bool
    reason: Optional[str] = None
    expires_at: Optional[datetime] = None


class OverrideOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    permission: PermissionOut
    granted: bool
    granted_by: Optional[uuid.UUID]
    reason: Optional[str]
    expires_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
