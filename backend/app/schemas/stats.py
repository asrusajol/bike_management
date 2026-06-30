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


class MonthlyStats(BaseModel):
    month: str
    fuel_cost: float
    service_cost: float
    expense_cost: float
    total_cost: float


class BikeStats(BaseModel):
    bike_id: str
    summary: CostSummary
    monthly: list[MonthlyStats]
    avg_fuel_efficiency: Optional[float]
    cost_per_km: Optional[float]
