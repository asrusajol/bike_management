from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DBSession
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse
from app.services.bike_service import get_bike_for_user

router = APIRouter()


@router.get("/", response_model=list[ReminderResponse])
async def list_reminders(bike_id: UUID, current_user: CurrentUser, db: DBSession):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(select(Reminder).where(Reminder.bike_id == bike_id))
    return result.scalars().all()


@router.post("/", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(
    bike_id: UUID, data: ReminderCreate, current_user: CurrentUser, db: DBSession
):
    await get_bike_for_user(db, bike_id, current_user.id)
    reminder = Reminder(**data.model_dump(), bike_id=bike_id)
    db.add(reminder)
    await db.commit()
    await db.refresh(reminder)
    return reminder


@router.patch("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(
    bike_id: UUID, reminder_id: UUID, data: ReminderUpdate, current_user: CurrentUser, db: DBSession
):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(
        select(Reminder).where(Reminder.id == reminder_id, Reminder.bike_id == bike_id)
    )
    reminder = result.scalar_one_or_none()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(reminder, field, value)
    await db.commit()
    await db.refresh(reminder)
    return reminder


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(
    bike_id: UUID, reminder_id: UUID, current_user: CurrentUser, db: DBSession
):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(
        select(Reminder).where(Reminder.id == reminder_id, Reminder.bike_id == bike_id)
    )
    reminder = result.scalar_one_or_none()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    await db.delete(reminder)
    await db.commit()
