from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DBSession
from app.models.bike import Bike
from app.schemas.bike import BikeCreate, BikeUpdate, BikeResponse
from app.services.bike_service import get_bike_for_user

router = APIRouter()


@router.get("/", response_model=list[BikeResponse])
async def list_bikes(current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Bike).where(Bike.user_id == current_user.id).order_by(Bike.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=BikeResponse, status_code=status.HTTP_201_CREATED)
async def create_bike(data: BikeCreate, current_user: CurrentUser, db: DBSession):
    bike = Bike(**data.model_dump(), user_id=current_user.id)
    db.add(bike)
    await db.commit()
    await db.refresh(bike)
    return bike


@router.get("/{bike_id}", response_model=BikeResponse)
async def get_bike(bike_id: UUID, current_user: CurrentUser, db: DBSession):
    return await get_bike_for_user(db, bike_id, current_user.id)


@router.patch("/{bike_id}", response_model=BikeResponse)
async def update_bike(bike_id: UUID, data: BikeUpdate, current_user: CurrentUser, db: DBSession):
    bike = await get_bike_for_user(db, bike_id, current_user.id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(bike, field, value)
    await db.commit()
    await db.refresh(bike)
    return bike


@router.delete("/{bike_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bike(bike_id: UUID, current_user: CurrentUser, db: DBSession):
    bike = await get_bike_for_user(db, bike_id, current_user.id)
    await db.delete(bike)
    await db.commit()
