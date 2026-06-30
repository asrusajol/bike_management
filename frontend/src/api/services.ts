import { apiClient } from './client';
import type { ServiceLog, ServiceLogCreate, ServiceLogUpdate } from '@/types/service';

const base = (bikeId: string) => `/bikes/${bikeId}/services`;

export const listServiceLogs = async (bikeId: string) => (await apiClient.get<ServiceLog[]>(`${base(bikeId)}/`)).data;
export const createServiceLog = async (bikeId: string, data: ServiceLogCreate) => (await apiClient.post<ServiceLog>(`${base(bikeId)}/`, data)).data;
export const updateServiceLog = async (bikeId: string, id: string, data: ServiceLogUpdate) => (await apiClient.patch<ServiceLog>(`${base(bikeId)}/${id}`, data)).data;
export const deleteServiceLog = async (bikeId: string, id: string) => { await apiClient.delete(`${base(bikeId)}/${id}`); };
