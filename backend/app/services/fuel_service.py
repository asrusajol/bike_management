from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fuel_log import FuelLog


async def calculate_fuel_efficiency(
    db: AsyncSession, bike_id: UUID, current_log: FuelLog
) -> Optional[float]:
    """Return km/l (or miles/gallon) for a full-tank log relative to the previous full-tank log."""
    if not current_log.is_full_tank:
        return None

    result = await db.execute(
        select(FuelLog)
        .where(
            FuelLog.bike_id == bike_id,
            FuelLog.id != current_log.id,
            FuelLog.odometer_reading < current_log.odometer_reading,
            FuelLog.is_full_tank.is_(True),
        )
        .order_by(FuelLog.odometer_reading.desc())
        .limit(1)
    )
    prev_log = result.scalar_one_or_none()
    if not prev_log:
        return None

    distance = current_log.odometer_reading - prev_log.odometer_reading
    if distance <= 0 or current_log.fuel_quantity <= 0:
        return None

    return round(distance / current_log.fuel_quantity, 2)
