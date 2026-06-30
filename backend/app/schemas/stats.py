from typing import Optional
from pydantic import BaseModel


class CostSummary(BaseModel):
    total_fuel_cost: float
    total_service_cost: float
    total_expense_cost: float
    total_cost: float
    fuel_logs_count: int
    service_logs_count: int
    expense_count: int
    # KM tracking
    total_km_run: Optional[float] = None
    daily_avg_km: Optional[float] = None
    days_tracked: Optional[int] = None
    # Fuel detail
    fuel_daily_avg_cost: Optional[float] = None
    fuel_min_efficiency: Optional[float] = None
    fuel_max_efficiency: Optional[float] = None


class MonthlyStats(BaseModel):
    month: str
    fuel_cost: float
    service_cost: float
    expense_cost: float
    total_cost: float


class ExpenseCategoryBreakdown(BaseModel):
    category: str
    cost: float


class BikeStats(BaseModel):
    bike_id: str
    summary: CostSummary
    monthly: list[MonthlyStats]
    avg_fuel_efficiency: Optional[float]
    cost_per_km: Optional[float]
    expense_by_category: list[ExpenseCategoryBreakdown] = []
