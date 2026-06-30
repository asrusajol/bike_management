from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DBSession
from app.models.fuel_log import FuelLog
from app.schemas.fuel_log import FuelLogCreate, FuelLogUpdate, FuelLogResponse
from app.services.bike_service import get_bike_for_user

router = APIRouter()


@router.get("/", response_model=list[FuelLogResponse])
async def list_fuel_logs(bike_id: UUID, current_user: CurrentUser, db: DBSession):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(
        select(FuelLog).where(FuelLog.bike_id == bike_id).order_by(FuelLog.date.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=FuelLogResponse, status_code=status.HTTP_201_CREATED)
async def create_fuel_log(bike_id: UUID, data: FuelLogCreate, current_user: CurrentUser, db: DBSession):
    await get_bike_for_user(db, bike_id, current_user.id)
    log = FuelLog(**data.model_dump(), bike_id=bike_id)
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/{log_id}", response_model=FuelLogResponse)
async def get_fuel_log(bike_id: UUID, log_id: UUID, current_user: CurrentUser, db: DBSession):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(
        select(FuelLog).where(FuelLog.id == log_id, FuelLog.bike_id == bike_id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    return log


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
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(log, field, value)
    await db.commit()
    await db.refresh(log)
    return log


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
