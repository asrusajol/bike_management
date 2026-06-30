import { apiClient } from './client';
import type { Reminder, ReminderCreate, ReminderUpdate } from '@/types/reminder';

const base = (bikeId: string) => `/bikes/${bikeId}/reminders`;

export const listReminders = async (bikeId: string) => (await apiClient.get<Reminder[]>(`${base(bikeId)}/`)).data;
export const createReminder = async (bikeId: string, data: ReminderCreate) => (await apiClient.post<Reminder>(`${base(bikeId)}/`, data)).data;
export const updateReminder = async (bikeId: string, id: string, data: ReminderUpdate) => (await apiClient.patch<Reminder>(`${base(bikeId)}/${id}`, data)).data;
export const deleteReminder = async (bikeId: string, id: string) => { await apiClient.delete(`${base(bikeId)}/${id}`); };
