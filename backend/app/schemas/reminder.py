from uuid import UUID
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import ReminderType


class ReminderCreate(BaseModel):
    type: ReminderType
    title: str
    trigger_km: Optional[float] = None
    trigger_date: Optional[date] = None
    notes: Optional[str] = None


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    trigger_km: Optional[float] = None
    trigger_date: Optional[date] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class ReminderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    bike_id: UUID
    type: ReminderType
    title: str
    trigger_km: Optional[float]
    trigger_date: Optional[date]
    is_active: bool
    last_notified_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
