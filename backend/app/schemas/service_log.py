from uuid import UUID
from datetime import date, datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


def _as_utc(v: datetime) -> datetime:
    return v if v.tzinfo is not None else v.replace(tzinfo=timezone.utc)


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

    @field_validator("logged_at", mode="after")
    @classmethod
    def normalise_tz(cls, v: datetime) -> datetime:
        return _as_utc(v)

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

    @field_validator("logged_at", mode="after")
    @classmethod
    def normalise_tz(cls, v: Optional[datetime]) -> Optional[datetime]:
        return _as_utc(v) if v is not None else v


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
