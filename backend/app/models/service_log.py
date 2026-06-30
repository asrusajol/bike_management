import uuid
from datetime import date
from typing import Optional

from sqlalchemy import String, Float, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin
from app.models.enums import ServiceType


class ServiceLog(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "service_logs"

    bike_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bikes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    odometer_reading: Mapped[Optional[float]] = mapped_column(Float)
    service_type: Mapped[ServiceType] = mapped_column(SAEnum(ServiceType), nullable=False)
    cost: Mapped[float] = mapped_column(Float, nullable=False)
    workshop_name: Mapped[Optional[str]] = mapped_column(String(200))
    next_service_km: Mapped[Optional[float]] = mapped_column(Float)
    next_service_date: Mapped[Optional[date]] = mapped_column(Date)
    notes: Mapped[Optional[str]] = mapped_column(String(1000))

    bike: Mapped["Bike"] = relationship("Bike", back_populates="service_logs")
