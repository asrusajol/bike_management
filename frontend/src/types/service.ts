export type ServiceType =
  | 'oil_change'
  | 'tire'
  | 'brake'
  | 'chain'
  | 'filter'
  | 'battery'
  | 'spark_plug'
  | 'coolant'
  | 'general'
  | 'other';

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  oil_change: 'Oil Change',
  tire: 'Tire',
  brake: 'Brake',
  chain: 'Chain',
  filter: 'Filter',
  battery: 'Battery',
  spark_plug: 'Spark Plug',
  coolant: 'Coolant',
  general: 'General Service',
  other: 'Other',
};

export interface ServiceLog {
  id: string;
  bike_id: string;
  date: string;
  odometer_reading?: number;
  service_type: ServiceType;
  cost: number;
  workshop_name?: string;
  next_service_km?: number;
  next_service_date?: string;
  notes?: string;
  created_at: string;
}

export interface ServiceLogCreate {
  date: string;
  odometer_reading?: number;
  service_type: ServiceType;
  cost: number;
  workshop_name?: string;
  next_service_km?: number;
  next_service_date?: string;
  notes?: string;
}

export type ServiceLogUpdate = Partial<ServiceLogCreate>;
