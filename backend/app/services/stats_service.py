from typing import Optional
from uuid import UUID

from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fuel_log import FuelLog
from app.models.service_log import ServiceLog
from app.models.expense import Expense
from app.schemas.stats import MonthlyStats


async def get_monthly_stats(db: AsyncSession, bike_id: UUID) -> list[MonthlyStats]:
    fuel_q = await db.execute(
        select(
            func.to_char(FuelLog.logged_at, "YYYY-MM").label("month"),
            func.sum(FuelLog.total_cost).label("fuel_cost"),
        )
        .where(FuelLog.bike_id == bike_id)
        .group_by("month")
    )
    fuel_by_month = {row.month: float(row.fuel_cost) for row in fuel_q}

    service_q = await db.execute(
        select(
            func.to_char(ServiceLog.logged_at, "YYYY-MM").label("month"),
            func.sum(ServiceLog.cost).label("service_cost"),
        )
        .where(ServiceLog.bike_id == bike_id)
        .group_by("month")
    )
    service_by_month = {row.month: float(row.service_cost) for row in service_q}

    expense_q = await db.execute(
        select(
            func.to_char(Expense.logged_at, "YYYY-MM").label("month"),
            func.sum(Expense.cost).label("expense_cost"),
        )
        .where(Expense.bike_id == bike_id)
        .group_by("month")
    )
    expense_by_month = {row.month: float(row.expense_cost) for row in expense_q}

    all_months = sorted(
        set(fuel_by_month) | set(service_by_month) | set(expense_by_month)
    )

    return [
        MonthlyStats(
            month=month,
            fuel_cost=fuel_by_month.get(month, 0.0),
            service_cost=service_by_month.get(month, 0.0),
            expense_cost=expense_by_month.get(month, 0.0),
            total_cost=(
                fuel_by_month.get(month, 0.0)
                + service_by_month.get(month, 0.0)
                + expense_by_month.get(month, 0.0)
            ),
        )
        for month in all_months
    ]


def _compute_efficiencies(logs: list) -> list[float]:
    """Return per-fill-up km/L values from consecutive odometer pairs."""
    result = []
    for i in range(1, len(logs)):
        distance = logs[i].odometer_reading - logs[i - 1].odometer_reading
        if distance > 0 and logs[i].fuel_quantity > 0:
            result.append(round(distance / logs[i].fuel_quantity, 2))
    return result


async def get_avg_fuel_efficiency(db: AsyncSession, bike_id: UUID) -> Optional[float]:
    result = await db.execute(
        select(FuelLog)
        .where(FuelLog.bike_id == bike_id, FuelLog.is_full_tank.is_(True))
        .order_by(FuelLog.odometer_reading.asc())
    )
    logs = list(result.scalars().all())
    efficiencies = _compute_efficiencies(logs)
    return round(sum(efficiencies) / len(efficiencies), 2) if efficiencies else None


async def get_fuel_efficiency_range(
    db: AsyncSession, bike_id: UUID
) -> tuple[Optional[float], Optional[float]]:
    """Return (min_efficiency, max_efficiency) across all consecutive log pairs."""
    result = await db.execute(
        select(FuelLog)
        .where(FuelLog.bike_id == bike_id, FuelLog.odometer_reading.isnot(None))
        .order_by(FuelLog.logged_at.asc())
    )
    logs = list(result.scalars().all())
    efficiencies = _compute_efficiencies(logs)
    if not efficiencies:
        return None, None
    return min(efficiencies), max(efficiencies)
