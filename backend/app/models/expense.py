import uuid
from datetime import date
from typing import Optional

from sqlalchemy import String, Float, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin
from app.models.enums import ExpenseCategory


class Expense(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "expenses"

    bike_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bikes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    category: Mapped[ExpenseCategory] = mapped_column(SAEnum(ExpenseCategory), nullable=False)
    cost: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500))
    receipt_image_url: Mapped[Optional[str]] = mapped_column(String(500))
    notes: Mapped[Optional[str]] = mapped_column(String(1000))

    bike: Mapped["Bike"] = relationship("Bike", back_populates="expenses")
