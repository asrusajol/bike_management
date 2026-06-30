from uuid import UUID
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import ExpenseCategory


class ExpenseCreate(BaseModel):
    date: date
    category: ExpenseCategory
    cost: float
    description: Optional[str] = None
    notes: Optional[str] = None


class ExpenseUpdate(BaseModel):
    date: Optional[date] = None
    category: Optional[ExpenseCategory] = None
    cost: Optional[float] = None
    description: Optional[str] = None
    notes: Optional[str] = None


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    bike_id: UUID
    date: date
    category: ExpenseCategory
    cost: float
    description: Optional[str]
    receipt_image_url: Optional[str]
    notes: Optional[str]
    created_at: datetime
