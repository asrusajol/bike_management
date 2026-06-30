import { apiClient } from './client';
import type { BikeStats } from '@/types/stats';

export const getBikeStats = async (bikeId: string) =>
  (await apiClient.get<BikeStats>(`/bikes/${bikeId}/stats/`)).data;
