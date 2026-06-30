from uuid import UUID
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import OdometerUnit


class BikeCreate(BaseModel):
    name: str
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    cc: Optional[int] = None
    colour: Optional[str] = None
    tank_capacity: Optional[float] = None
    odometer_unit: OdometerUnit = OdometerUnit.KM
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = None
    plate_number: Optional[str] = None
    notes: Optional[str] = None


class BikeUpdate(BaseModel):
    name: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    cc: Optional[int] = None
    colour: Optional[str] = None
    tank_capacity: Optional[float] = None
    odometer_unit: Optional[OdometerUnit] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = None
    plate_number: Optional[str] = None
    notes: Optional[str] = None


class BikeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    make: Optional[str]
    model: Optional[str]
    year: Optional[int]
    cc: Optional[int]
    colour: Optional[str]
    tank_capacity: Optional[float]
    odometer_unit: OdometerUnit
    purchase_date: Optional[date]
    purchase_price: Optional[float]
    plate_number: Optional[str]
    notes: Optional[str]
    image_url: Optional[str]
    created_at: datetime