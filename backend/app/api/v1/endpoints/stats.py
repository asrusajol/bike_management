from uuid import UUID

from fastapi import APIRouter, HTTPException
from sqlalchemy import select, func

from app.core.deps import CurrentUser, DBSession
from app.models.bike import Bike
from app.models.fuel_log import FuelLog
from app.models.service_log import ServiceLog
from app.models.expense import Expense
from app.schemas.stats import BikeStats, CostSummary
from app.services.stats_service import get_monthly_stats, get_avg_fuel_efficiency

router = APIRouter()


@router.get("/", response_model=BikeStats)
async def get_bike_stats(bike_id: UUID, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Bike).where(Bike.id == bike_id, Bike.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Bike not found")

    fuel_row = await db.execute(
        select(func.coalesce(func.sum(FuelLog.total_cost), 0.0), func.count(FuelLog.id))
        .where(FuelLog.bike_id == bike_id)
    )
    fuel_cost, fuel_count = fuel_row.one()

    service_row = await db.execute(
        select(func.coalesce(func.sum(ServiceLog.cost), 0.0), func.count(ServiceLog.id))
        .where(ServiceLog.bike_id == bike_id)
    )
    service_cost, service_count = service_row.one()

    expense_row = await db.execute(
        select(func.coalesce(func.sum(Expense.cost), 0.0), func.count(Expense.id))
        .where(Expense.bike_id == bike_id)
    )
    expense_cost, expense_count = expense_row.one()

    summary = CostSummary(
        total_fuel_cost=float(fuel_cost),
        total_service_cost=float(service_cost),
        total_expense_cost=float(expense_cost),
        total_cost=float(fuel_cost) + float(service_cost) + float(expense_cost),
        fuel_logs_count=fuel_count,
        service_logs_count=service_count,
        expense_count=expense_count,
    )

    monthly = await get_monthly_stats(db, bike_id)
    avg_efficiency = await get_avg_fuel_efficiency(db, bike_id)

    return BikeStats(
        bike_id=str(bike_id),
        summary=summary,
        monthly=monthly,
        avg_fuel_efficiency=avg_efficiency,
        cost_per_km=None,
    )
