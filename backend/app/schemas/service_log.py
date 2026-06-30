from uuid import UUID
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import ServiceType


class ServiceLogCreate(BaseModel):
    date: date
    odometer_reading: Optional[float] = None
    service_type: ServiceType
    cost: float
    workshop_name: Optional[str] = None
    next_service_km: Optional[float] = None
    next_service_date: Optional[date] = None
    notes: Optional[str] = None


class ServiceLogUpdate(BaseModel):
    date: Optional[date] = None
    odometer_reading: Optional[float] = None
    service_type: Optional[ServiceType] = None
    cost: Optional[float] = None
    workshop_name: Optional[str] = None
    next_service_km: Optional[float] = None
    next_service_date: Optional[date] = None
    notes: Optional[str] = None


class ServiceLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    bike_id: UUID
    date: date
    odometer_reading: Optional[float]
    service_type: ServiceType
    cost: float
    workshop_name: Optional[str]
    next_service_km: Optional[float]
    next_service_date: Optional[date]
    notes: Optional[str]
    created_at: datetime
