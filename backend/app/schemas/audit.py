import uuid
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    clinic_id: Optional[uuid.UUID]
    clinic_name: Optional[str]
    user_id: Optional[uuid.UUID]
    user_email: Optional[str]
    user_role: Optional[str]
    acting_as: Optional[str]

    action: str
    resource_type: str
    resource_id: Optional[str]
    old_values: Optional[Any]
    new_values: Optional[Any]
    changed_fields: Optional[List[str]]

    ip_address: str
    user_agent: Optional[str]
    device_type: Optional[str]
    browser: Optional[str]
    os: Optional[str]
    country: Optional[str]
    city: Optional[str]

    request_id: uuid.UUID
    session_id: Optional[uuid.UUID]
    api_endpoint: Optional[str]
    http_method: Optional[str]
    duration_ms: Optional[int]

    status: str
    failure_reason: Optional[str]
    risk_score: int
    flags: Optional[List[str]]

    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogPage(BaseModel):
    items: List[AuditLogOut]
    total: int
    page: int
    page_size: int
    pages: int


class AuditStats(BaseModel):
    total: int
    success: int
    failure: int
    blocked: int
    high_risk: int
    top_actions: List[dict]
    top_users: List[dict]
