from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import ExpenseCategory


class ExpenseCreate(BaseModel):
    logged_at: datetime
    category: ExpenseCategory
    cost: float
    description: Optional[str] = None
    notes: Optional[str] = None


class ExpenseUpdate(BaseModel):
    logged_at: Optional[datetime] = None
    category: Optional[ExpenseCategory] = None
    cost: Optional[float] = None
    description: Optional[str] = None
    notes: Optional[str] = None


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
