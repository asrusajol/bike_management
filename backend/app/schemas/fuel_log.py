from uuid import UUID
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


def _as_utc(v: datetime) -> datetime:
    """Attach UTC timezone to naive datetimes so PostgreSQL TIMESTAMPTZ is happy."""
    return v if v.tzinfo is not None else v.replace(tzinfo=timezone.utc)


class FuelLogCreate(BaseModel):
    logged_at: datetime
    odometer_reading: float
    fuel_quantity: Optional[float] = None
    fuel_price_per_unit: float
    total_cost: Optional[float] = None
    is_full_tank: bool = True
    station_name: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("logged_at", mode="after")
    @classmethod
    def normalise_tz(cls, v: datetime) -> datetime:
        return _as_utc(v)

    @model_validator(mode="after")
    def compute_missing(self):
        q = self.fuel_quantity
        p = self.fuel_price_per_unit
        t = self.total_cost

        if p <= 0:
            raise ValueError("fuel_price_per_unit must be greater than 0")

        if q is not None and t is None:
            self.total_cost = round(q * p, 2)
        elif t is not None and q is None:
            self.fuel_quantity = round(t / p, 4)
        elif q is None and t is None:
            raise ValueError("Provide either fuel_quantity or total_cost")
        return self


class FuelLogUpdate(BaseModel):
    logged_at: Optional[datetime] = None
    odometer_reading: Optional[float] = None
    fuel_quantity: Optional[float] = None
    fuel_price_per_unit: Optional[float] = None
    total_cost: Optional[float] = None
    is_full_tank: Optional[bool] = None
    station_name: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("logged_at", mode="after")
    @classmethod
    def normalise_tz(cls, v: Optional[datetime]) -> Optional[datetime]:
        return _as_utc(v) if v is not None else v


class FuelLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    bike_id: UUID
    logged_at: datetime
    odometer_reading: float
    fuel_quantity: float
    fuel_price_per_unit: float
    total_cost: float
    is_full_tank: bool
    station_name: Optional[str]
    notes: Optional[str]
    created_at: datetime
    # Computed fields — not stored in DB
    km_since_last: Optional[float] = None
    fuel_efficiency: Optional[float] = None  # km per litre
