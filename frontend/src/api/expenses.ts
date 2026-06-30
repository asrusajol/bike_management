import { apiClient } from './client';
import type { Expense, ExpenseCreate, ExpenseUpdate } from '@/types/expense';

const base = (bikeId: string) => `/bikes/${bikeId}/expenses`;

export const listExpenses = async (bikeId: string) => (await apiClient.get<Expense[]>(`${base(bikeId)}/`)).data;
export const createExpense = async (bikeId: string, data: ExpenseCreate) => (await apiClient.post<Expense>(`${base(bikeId)}/`, data)).data;
export const updateExpense = async (bikeId: string, id: string, data: ExpenseUpdate) => (await apiClient.patch<Expense>(`${base(bikeId)}/${id}`, data)).data;
export const deleteExpense = async (bikeId: string, id: string) => { await apiClient.delete(`${base(bikeId)}/${id}`); };
