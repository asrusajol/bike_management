export type ExpenseCategory =
  | 'insurance'
  | 'tax'
  | 'parking'
  | 'accessories'
  | 'repair'
  | 'cleaning'
  | 'fine'
  | 'other';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  insurance: 'Insurance',
  tax: 'Tax / Registration',
  parking: 'Parking',
  accessories: 'Accessories',
  repair: 'Repair',
  cleaning: 'Cleaning',
  fine: 'Fine',
  other: 'Other',
};

export interface Expense {
  id: string;
  bike_id: string;
  date: string;
  category: ExpenseCategory;
  cost: number;
  description?: string;
  receipt_image_url?: string;
  notes?: string;
  created_at: string;
}

export interface ExpenseCreate {
  date: string;
  category: ExpenseCategory;
  cost: number;
  description?: string;
  notes?: string;
}

export type ExpenseUpdate = Partial<ExpenseCreate>;
