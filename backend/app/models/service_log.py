from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import Float, Date, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class ServiceLog(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "service_logs"

    bike_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bikes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    odometer_reading: Mapped[Optional[float]] = mapped_column(Float)
    # [{name: str, cost: float}, ...] — individual line items
    service_items: Mapped[list] = mapped_column(JSONB, nullable=False)
    cost: Mapped[float] = mapped_column(Float, nullable=False)  # sum of service_items costs
    workshop_name: Mapped[Optional[str]] = mapped_column(String(200))
    next_service_km: Mapped[Optional[float]] = mapped_column(Float)
    next_service_date: Mapped[Optional[date]] = mapped_column(Date)
    notes: Mapped[Optional[str]] = mapped_column(String(1000))

    bike: Mapped["Bike"] = relationship("Bike", back_populates="service_logs")
