from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class FuelLog(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "fuel_logs"

    bike_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bikes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    odometer_reading: Mapped[float] = mapped_column(Float, nullable=False)
    fuel_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    fuel_price_per_unit: Mapped[float] = mapped_column(Float, nullable=False)
    total_cost: Mapped[float] = mapped_column(Float, nullable=False)
    is_full_tank: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    station_name: Mapped[Optional[str]] = mapped_column(String(200))
    notes: Mapped[Optional[str]] = mapped_column(String(500))

    bike: Mapped["Bike"] = relationship("Bike", back_populates="fuel_logs")
