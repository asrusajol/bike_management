from uuid import UUID
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, model_validator


class FuelLogCreate(BaseModel):
    date: date
    odometer_reading: float
    fuel_quantity: float
    fuel_price_per_unit: float
    total_cost: Optional[float] = None
    is_full_tank: bool = True
    station_name: Optional[str] = None
    notes: Optional[str] = None

    @model_validator(mode="after")
    def compute_total_cost(self):
        if self.total_cost is None:
            self.total_cost = round(self.fuel_quantity * self.fuel_price_per_unit, 2)
        return self


class FuelLogUpdate(BaseModel):
    date: Optional[date] = None
    odometer_reading: Optional[float] = None
    fuel_quantity: Optional[float] = None
    fuel_price_per_unit: Optional[float] = None
    total_cost: Optional[float] = None
    is_full_tank: Optional[bool] = None
    station_name: Optional[str] = None
    notes: Optional[str] = None


class FuelLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    bike_id: UUID
    date: date
    odometer_reading: float
    fuel_quantity: float
    fuel_price_per_unit: float
    total_cost: float
    is_full_tank: bool
    station_name: Optional[str]
    notes: Optional[str]
    created_at: datetime
