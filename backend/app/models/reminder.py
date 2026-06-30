import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import String, Float, Boolean, Date, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin
from app.models.enums import ReminderType


class Reminder(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "reminders"

    bike_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bikes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type: Mapped[ReminderType] = mapped_column(SAEnum(ReminderType), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    trigger_km: Mapped[Optional[float]] = mapped_column(Float)
    trigger_date: Mapped[Optional[date]] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_notified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    notes: Mapped[Optional[str]] = mapped_column(String(500))

    bike: Mapped["Bike"] = relationship("Bike", back_populates="reminders")
