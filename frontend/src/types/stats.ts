export interface CostSummary {
  total_fuel_cost: number;
  total_service_cost: number;
  total_expense_cost: number;
  total_cost: number;
  fuel_logs_count: number;
  service_logs_count: number;
  expense_count: number;
  // KM tracking
  total_km_run: number | null;
  daily_avg_km: number | null;
  days_tracked: number | null;
  // Fuel detail
  fuel_daily_avg_cost: number | null;
  fuel_min_efficiency: number | null;
  fuel_max_efficiency: number | null;
}

export interface MonthlyStats {
  month: string;
  fuel_cost: number;
  service_cost: number;
  expense_cost: number;
  total_cost: number;
}

export interface ExpenseCategoryBreakdown {
  category: string;
  cost: number;
}

export interface BikeStats {
  bike_id: string;
  summary: CostSummary;
  monthly: MonthlyStats[];
  avg_fuel_efficiency: number | null;
  cost_per_km: number | null;
  expense_by_category: ExpenseCategoryBreakdown[];
}
