export type OdometerUnit = 'km' | 'miles';

export interface Bike {
  id: string;
  user_id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  odometer_unit: OdometerUnit;
  purchase_date?: string;
  purchase_price?: number;
  plate_number?: string;
  notes?: string;
  image_url?: string;
  created_at: string;
}

export interface BikeCreate {
  name: string;
  make?: string;
  model?: string;
  year?: number;
  odometer_unit?: OdometerUnit;
  purchase_date?: string;
  purchase_price?: number;
  plate_number?: string;
  notes?: string;
}

export type BikeUpdate = Partial<BikeCreate>;
