from uuid import UUID

from fastapi import APIRouter, HTTPException
from sqlalchemy import select, func

from app.core.deps import CurrentUser, DBSession
from app.models.bike import Bike
from app.models.fuel_log import FuelLog
from app.models.service_log import ServiceLog
from app.models.expense import Expense
from app.schemas.stats import BikeStats, CostSummary, ExpenseCategoryBreakdown
from app.services.stats_service import (
    get_monthly_stats,
    get_avg_fuel_efficiency,
    get_fuel_efficiency_range,
)

router = APIRouter()


@router.get("/", response_model=BikeStats)
async def get_bike_stats(bike_id: UUID, current_user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Bike).where(Bike.id == bike_id, Bike.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Bike not found")

    # ── Basic cost totals ─────────────────────────────────────────────────────
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

    # ── KM tracking ───────────────────────────────────────────────────────────
    km_row = await db.execute(
        select(func.min(FuelLog.odometer_reading), func.max(FuelLog.odometer_reading))
        .where(FuelLog.bike_id == bike_id, FuelLog.odometer_reading.isnot(None))
    )
    min_odo, max_odo = km_row.one()
    total_km_run = (
        round(float(max_odo) - float(min_odo), 1)
        if min_odo is not None and max_odo is not None and max_odo > min_odo
        else None
    )

    # ── Days tracked (across all three log types) ─────────────────────────────
    fuel_dt_row = await db.execute(
        select(func.min(FuelLog.logged_at), func.max(FuelLog.logged_at))
        .where(FuelLog.bike_id == bike_id)
    )
    fuel_min_dt, fuel_max_dt = fuel_dt_row.one()

    svc_dt_row = await db.execute(
        select(func.min(ServiceLog.logged_at), func.max(ServiceLog.logged_at))
        .where(ServiceLog.bike_id == bike_id)
    )
    svc_min_dt, svc_max_dt = svc_dt_row.one()

    exp_dt_row = await db.execute(
        select(func.min(Expense.logged_at), func.max(Expense.logged_at))
        .where(Expense.bike_id == bike_id)
    )
    exp_min_dt, exp_max_dt = exp_dt_row.one()

    all_dts = [d for d in [fuel_min_dt, fuel_max_dt, svc_min_dt, svc_max_dt, exp_min_dt, exp_max_dt] if d]
    if len(all_dts) >= 2:
        days_tracked = max((max(all_dts) - min(all_dts)).days + 1, 1)
    elif len(all_dts) == 1:
        days_tracked = 1
    else:
        days_tracked = None

    daily_avg_km = (
        round(total_km_run / days_tracked, 1)
        if total_km_run and days_tracked
        else None
    )

    fuel_daily_avg_cost = (
        round(float(fuel_cost) / days_tracked, 2)
        if float(fuel_cost) > 0 and days_tracked
        else None
    )

    # ── Fuel efficiency range ─────────────────────────────────────────────────
    fuel_min_eff, fuel_max_eff = await get_fuel_efficiency_range(db, bike_id)

    # ── Expense breakdown by category ─────────────────────────────────────────
    cat_q = await db.execute(
        select(Expense.category, func.sum(Expense.cost).label("total"))
        .where(Expense.bike_id == bike_id)
        .group_by(Expense.category)
        .order_by(func.sum(Expense.cost).desc())
    )
    expense_by_category = [
        ExpenseCategoryBreakdown(category=str(row.category.value), cost=round(float(row.total), 2))
        for row in cat_q
    ]

    summary = CostSummary(
        total_fuel_cost=float(fuel_cost),
        total_service_cost=float(service_cost),
        total_expense_cost=float(expense_cost),
        total_cost=float(fuel_cost) + float(service_cost) + float(expense_cost),
        fuel_logs_count=fuel_count,
        service_logs_count=service_count,
        expense_count=expense_count,
        total_km_run=total_km_run,
        daily_avg_km=daily_avg_km,
        days_tracked=days_tracked,
        fuel_daily_avg_cost=fuel_daily_avg_cost,
        fuel_min_efficiency=fuel_min_eff,
        fuel_max_efficiency=fuel_max_eff,
    )

    monthly = await get_monthly_stats(db, bike_id)
    avg_efficiency = await get_avg_fuel_efficiency(db, bike_id)

    return BikeStats(
        bike_id=str(bike_id),
        summary=summary,
        monthly=monthly,
        avg_fuel_efficiency=avg_efficiency,
        cost_per_km=None,
        expense_by_category=expense_by_category,
    )
