import uuid
from datetime import date
from typing import Optional

from sqlalchemy import String, Float, Integer, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin
from app.models.enums import OdometerUnit


class Bike(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "bikes"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    make: Mapped[Optional[str]] = mapped_column(String(100))
    model: Mapped[Optional[str]] = mapped_column(String(100))
    year: Mapped[Optional[int]] = mapped_column(Integer)
    odometer_unit: Mapped[OdometerUnit] = mapped_column(
        SAEnum(OdometerUnit), default=OdometerUnit.KM, nullable=False
    )
    purchase_date: Mapped[Optional[date]] = mapped_column(Date)
    purchase_price: Mapped[Optional[float]] = mapped_column(Float)
    plate_number: Mapped[Optional[str]] = mapped_column(String(50))
    notes: Mapped[Optional[str]] = mapped_column(String(1000))
    image_url: Mapped[Optional[str]] = mapped_column(String(500))

    owner: Mapped["User"] = relationship("User", back_populates="bikes")
    fuel_logs: Mapped[list["FuelLog"]] = relationship(
        "FuelLog", back_populates="bike", cascade="all, delete-orphan"
    )
    service_logs: Mapped[list["ServiceLog"]] = relationship(
        "ServiceLog", back_populates="bike", cascade="all, delete-orphan"
    )
    expenses: Mapped[list["Expense"]] = relationship(
        "Expense", back_populates="bike", cascade="all, delete-orphan"
    )
    reminders: Mapped[list["Reminder"]] = relationship(
        "Reminder", back_populates="bike", cascade="all, delete-orphan"
    )
