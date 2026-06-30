from uuid import UUID
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, model_validator


class ServiceItem(BaseModel):
    name: str
    cost: float


class ServiceLogCreate(BaseModel):
    logged_at: datetime
    odometer_reading: Optional[float] = None
    service_items: list[ServiceItem]
    workshop_name: Optional[str] = None
    next_service_km: Optional[float] = None
    next_service_date: Optional[date] = None
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_items(self):
        cleaned = [i for i in self.service_items if i.name.strip()]
        if not cleaned:
            raise ValueError("At least one service item is required")
        self.service_items = cleaned
        return self


class ServiceLogUpdate(BaseModel):
    logged_at: Optional[datetime] = None
    odometer_reading: Optional[float] = None
    service_items: Optional[list[ServiceItem]] = None
    workshop_name: Optional[str] = None
    next_service_km: Optional[float] = None
    next_service_date: Optional[date] = None
    notes: Optional[str] = None


class ServiceLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    bike_id: UUID
    logged_at: datetime
    odometer_reading: Optional[float]
    service_items: list[ServiceItem]
    cost: float
    workshop_name: Optional[str]
    next_service_km: Optional[float]
    next_service_date: Optional[date]
    notes: Optional[str]
    created_at: datetime
