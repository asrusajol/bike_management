from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DBSession
from app.models.service_log import ServiceLog
from app.schemas.service_log import ServiceLogCreate, ServiceLogUpdate, ServiceLogResponse
from app.services.bike_service import get_bike_for_user

router = APIRouter()


@router.get("/", response_model=list[ServiceLogResponse])
async def list_service_logs(bike_id: UUID, current_user: CurrentUser, db: DBSession):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(
        select(ServiceLog).where(ServiceLog.bike_id == bike_id).order_by(ServiceLog.date.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=ServiceLogResponse, status_code=status.HTTP_201_CREATED)
async def create_service_log(
    bike_id: UUID, data: ServiceLogCreate, current_user: CurrentUser, db: DBSession
):
    await get_bike_for_user(db, bike_id, current_user.id)
    log = ServiceLog(**data.model_dump(), bike_id=bike_id)
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/{log_id}", response_model=ServiceLogResponse)
async def get_service_log(bike_id: UUID, log_id: UUID, current_user: CurrentUser, db: DBSession):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(
        select(ServiceLog).where(ServiceLog.id == log_id, ServiceLog.bike_id == bike_id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Service log not found")
    return log


@router.patch("/{log_id}", response_model=ServiceLogResponse)
async def update_service_log(
    bike_id: UUID, log_id: UUID, data: ServiceLogUpdate, current_user: CurrentUser, db: DBSession
):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(
        select(ServiceLog).where(ServiceLog.id == log_id, ServiceLog.bike_id == bike_id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Service log not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(log, field, value)
    await db.commit()
    await db.refresh(log)
    return log


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service_log(
    bike_id: UUID, log_id: UUID, current_user: CurrentUser, db: DBSession
):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(
        select(ServiceLog).where(ServiceLog.id == log_id, ServiceLog.bike_id == bike_id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Service log not found")
    await db.delete(log)
    await db.commit()
