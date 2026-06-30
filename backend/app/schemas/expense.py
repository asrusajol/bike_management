from uuid import UUID
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.enums import ExpenseCategory


def _as_utc(v: datetime) -> datetime:
    return v if v.tzinfo is not None else v.replace(tzinfo=timezone.utc)


class ExpenseCreate(BaseModel):
    logged_at: datetime
    category: ExpenseCategory
    cost: float
    description: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("logged_at", mode="after")
    @classmethod
    def normalise_tz(cls, v: datetime) -> datetime:
        return _as_utc(v)


class ExpenseUpdate(BaseModel):
    logged_at: Optional[datetime] = None
    category: Optional[ExpenseCategory] = None
    cost: Optional[float] = None
    description: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("logged_at", mode="after")
    @classmethod
    def normalise_tz(cls, v: Optional[datetime]) -> Optional[datetime]:
        return _as_utc(v) if v is not None else v


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    bike_id: UUID
    logged_at: datetime
    category: ExpenseCategory
    cost: float
    description: Optional[str]
    receipt_image_url: Optional[str]
    notes: Optional[str]
    created_at: datetime
