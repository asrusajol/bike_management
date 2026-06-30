from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DBSession
from app.models.fuel_log import FuelLog
from app.schemas.fuel_log import FuelLogCreate, FuelLogUpdate, FuelLogResponse
from app.services.bike_service import get_bike_for_user

router = APIRouter()


def _enrich(logs: list[FuelLog]) -> list[FuelLogResponse]:
    """Sort ASC, compute km_since_last and fuel_efficiency, return DESC."""
    ordered = sorted(logs, key=lambda l: l.logged_at)
    enriched: list[FuelLogResponse] = []
    for i, log in enumerate(ordered):
        km_since_last: float | None = None
        fuel_efficiency: float | None = None
        if i > 0:
            prev = ordered[i - 1]
            km = round(log.odometer_reading - prev.odometer_reading, 1)
            if km > 0 and log.fuel_quantity > 0:
                km_since_last = km
                fuel_efficiency = round(km / log.fuel_quantity, 2)
        base = FuelLogResponse.model_validate(log)
        enriched.append(base.model_copy(update={"km_since_last": km_since_last, "fuel_efficiency": fuel_efficiency}))
    return list(reversed(enriched))


async def _check_odometer_conflict(
    db: DBSession,
    bike_id: UUID,
    logged_at: datetime,
    odometer: float,
    exclude_id: UUID | None = None,
) -> None:
    """Raise 409 if the new entry's odometer conflicts with adjacent entries."""
    q = select(FuelLog).where(FuelLog.bike_id == bike_id).order_by(FuelLog.logged_at.asc())
    result = await db.execute(q)
    logs = [l for l in result.scalars().all() if l.id != exclude_id]

    prev_log: FuelLog | None = None
    next_log: FuelLog | None = None
    for log in logs:
        if log.logged_at <= logged_at:
            prev_log = log
        elif next_log is None:
            next_log = log

    if prev_log and odometer <= prev_log.odometer_reading:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Odometer {odometer:.1f} must be greater than the previous entry "
                f"({prev_log.odometer_reading:.1f} km on "
                f"{prev_log.logged_at.strftime('%Y-%m-%d %H:%M')})."
            ),
        )
    if next_log and odometer >= next_log.odometer_reading:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Odometer {odometer:.1f} must be less than the next entry "
                f"({next_log.odometer_reading:.1f} km on "
                f"{next_log.logged_at.strftime('%Y-%m-%d %H:%M')})."
            ),
        )


@router.get("/", response_model=list[FuelLogResponse])
async def list_fuel_logs(bike_id: UUID, current_user: CurrentUser, db: DBSession):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(
        select(FuelLog).where(FuelLog.bike_id == bike_id)
    )
    return _enrich(result.scalars().all())


@router.post("/", response_model=FuelLogResponse, status_code=status.HTTP_201_CREATED)
async def create_fuel_log(bike_id: UUID, data: FuelLogCreate, current_user: CurrentUser, db: DBSession):
    await get_bike_for_user(db, bike_id, current_user.id)

    if data.logged_at > datetime.now():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Fill-up datetime cannot be in the future.",
        )

    await _check_odometer_conflict(db, bike_id, data.logged_at, data.odometer_reading)

    log = FuelLog(**data.model_dump(), bike_id=bike_id)
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return FuelLogResponse.model_validate(log)


@router.get("/{log_id}", response_model=FuelLogResponse)
async def get_fuel_log(bike_id: UUID, log_id: UUID, current_user: CurrentUser, db: DBSession):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(
        select(FuelLog).where(FuelLog.id == log_id, FuelLog.bike_id == bike_id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    return FuelLogResponse.model_validate(log)


@router.patch("/{log_id}", response_model=FuelLogResponse)
async def update_fuel_log(
    bike_id: UUID, log_id: UUID, data: FuelLogUpdate, current_user: CurrentUser, db: DBSession
):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(
        select(FuelLog).where(FuelLog.id == log_id, FuelLog.bike_id == bike_id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Fuel log not found")

    update_data = data.model_dump(exclude_unset=True)

    new_logged_at = update_data.get("logged_at", log.logged_at)
    new_odometer = update_data.get("odometer_reading", log.odometer_reading)

    if "logged_at" in update_data and update_data["logged_at"] > datetime.now():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Fill-up datetime cannot be in the future.",
        )

    if "logged_at" in update_data or "odometer_reading" in update_data:
        await _check_odometer_conflict(db, bike_id, new_logged_at, new_odometer, exclude_id=log_id)

    for field, value in update_data.items():
        setattr(log, field, value)
    await db.commit()
    await db.refresh(log)
    return FuelLogResponse.model_validate(log)


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fuel_log(bike_id: UUID, log_id: UUID, current_user: CurrentUser, db: DBSession):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(
        select(FuelLog).where(FuelLog.id == log_id, FuelLog.bike_id == bike_id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    await db.delete(log)
    await db.commit()
