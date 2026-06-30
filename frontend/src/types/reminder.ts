export type ReminderType = 'service' | 'insurance' | 'tax' | 'custom';

export interface Reminder {
  id: string;
  bike_id: string;
  type: ReminderType;
  title: string;
  trigger_km?: number;
  trigger_date?: string;
  is_active: boolean;
  last_notified_at?: string;
  notes?: string;
  created_at: string;
}

export interface ReminderCreate {
  type: ReminderType;
  title: string;
  trigger_km?: number;
  trigger_date?: string;
  notes?: string;
}

export interface ReminderUpdate {
  title?: string;
  trigger_km?: number;
  trigger_date?: string;
  is_active?: boolean;
  notes?: string;
}
