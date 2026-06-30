export const PREDEFINED_SERVICE_TYPES: string[] = [
  'Engine Oil',
  'Brake Pad',
  'Air Filter',
  'Oil Filter',
  'Chain',
  'Tire',
  'Battery',
  'Spark Plug',
  'Coolant',
  'General Service',
  'Other',
];

export interface ServiceItem {
  name: string;
  cost: number;
}

export interface ServiceLog {
  id: string;
  bike_id: string;
  logged_at: string;
  odometer_reading?: number;
  service_items: ServiceItem[];
  cost: number;
  workshop_name?: string;
  next_service_km?: number;
  next_service_date?: string;
  notes?: string;
  created_at: string;
}

export interface ServiceLogCreate {
  logged_at: string;
  odometer_reading?: number;
  service_items: ServiceItem[];
  workshop_name?: string;
  next_service_km?: number;
  next_service_date?: string;
  notes?: string;
}

export type ServiceLogUpdate = Partial<ServiceLogCreate>;
