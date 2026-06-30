import { apiClient } from './client';
import type { Bike, BikeCreate, BikeUpdate } from '@/types/bike';

export const listBikes = async () => (await apiClient.get<Bike[]>('/bikes/')).data;
export const getBike = async (id: string) => (await apiClient.get<Bike>(`/bikes/${id}`)).data;
export const createBike = async (data: BikeCreate) => (await apiClient.post<Bike>('/bikes/', data)).data;
export const updateBike = async (id: string, data: BikeUpdate) => (await apiClient.patch<Bike>(`/bikes/${id}`, data)).data;
export const deleteBike = async (id: string) => { await apiClient.delete(`/bikes/${id}`); };
