export interface FuelLog {
  id: string;
  bike_id: string;
  logged_at: string;
  odometer_reading: number;
  fuel_quantity: number;
  fuel_price_per_unit: number;
  total_cost: number;
  is_full_tank: boolean;
  station_name?: string;
  notes?: string;
  km_since_last?: number;
  fuel_efficiency?: number;
  created_at: string;
}

export interface FuelLogCreate {
  logged_at: string;
  odometer_reading: number;
  fuel_quantity?: number;
  fuel_price_per_unit: number;
  total_cost?: number;
  is_full_tank?: boolean;
  station_name?: string;
  notes?: string;
}

export type FuelLogUpdate = Partial<FuelLogCreate>;
