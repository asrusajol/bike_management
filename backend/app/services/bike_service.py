from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bike import Bike


async def get_bike_for_user(db: AsyncSession, bike_id: UUID, user_id: UUID) -> Bike:
    result = await db.execute(select(Bike).where(Bike.id == bike_id, Bike.user_id == user_id))
    bike = result.scalar_one_or_none()
    if not bike:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bike not found")
    return bike
