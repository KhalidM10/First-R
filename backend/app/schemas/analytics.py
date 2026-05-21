import uuid
from datetime import date, datetime

from pydantic import BaseModel


class ClinicAnalyticsResponse(BaseModel):
    id: uuid.UUID
    clinic_id: uuid.UUID
    date: date
    total_appointments: int
    completed_appointments: int
    cancelled_appointments: int
    total_revenue_kes: float
    new_patients: int
    returning_patients: int

    model_config = {"from_attributes": True}


class ClinicStatsSummary(BaseModel):
    total_appointments_all_time: int
    completed_appointments_all_time: int
    total_revenue_all_time: float
    total_patients: int
    appointments_this_week: int
    revenue_this_week: float
