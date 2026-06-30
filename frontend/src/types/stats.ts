export interface CostSummary {
  total_fuel_cost: number;
  total_service_cost: number;
  total_expense_cost: number;
  total_cost: number;
  fuel_logs_count: number;
  service_logs_count: number;
  expense_count: number;
}

export interface MonthlyStats {
  month: string;
  fuel_cost: number;
  service_cost: number;
  expense_cost: number;
  total_cost: number;
}

export interface BikeStats {
  bike_id: string;
  summary: CostSummary;
  monthly: MonthlyStats[];
  avg_fuel_efficiency: number | null;
  cost_per_km: number | null;
}
