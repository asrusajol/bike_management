from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DBSession
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.services.bike_service import get_bike_for_user

router = APIRouter()


@router.get("/", response_model=list[ExpenseResponse])
async def list_expenses(bike_id: UUID, current_user: CurrentUser, db: DBSession):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(
        select(Expense).where(Expense.bike_id == bike_id).order_by(Expense.date.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(bike_id: UUID, data: ExpenseCreate, current_user: CurrentUser, db: DBSession):
    await get_bike_for_user(db, bike_id, current_user.id)
    expense = Expense(**data.model_dump(), bike_id=bike_id)
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(bike_id: UUID, expense_id: UUID, current_user: CurrentUser, db: DBSession):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.bike_id == bike_id)
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.patch("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    bike_id: UUID, expense_id: UUID, data: ExpenseUpdate, current_user: CurrentUser, db: DBSession
):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.bike_id == bike_id)
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    await db.commit()
    await db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(bike_id: UUID, expense_id: UUID, current_user: CurrentUser, db: DBSession):
    await get_bike_for_user(db, bike_id, current_user.id)
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.bike_id == bike_id)
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    await db.delete(expense)
    await db.commit()
