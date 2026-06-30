import { apiClient } from './client';
import type { FuelLog, FuelLogCreate, FuelLogUpdate } from '@/types/fuel';

const base = (bikeId: string) => `/bikes/${bikeId}/fuel`;

export const listFuelLogs = async (bikeId: string) => (await apiClient.get<FuelLog[]>(`${base(bikeId)}/`)).data;
export const createFuelLog = async (bikeId: string, data: FuelLogCreate) => (await apiClient.post<FuelLog>(`${base(bikeId)}/`, data)).data;
export const updateFuelLog = async (bikeId: string, id: string, data: FuelLogUpdate) => (await apiClient.patch<FuelLog>(`${base(bikeId)}/${id}`, data)).data;
export const deleteFuelLog = async (bikeId: string, id: string) => { await apiClient.delete(`${base(bikeId)}/${id}`); };
