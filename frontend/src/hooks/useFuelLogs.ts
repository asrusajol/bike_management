import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/fuel';
import type { FuelLogCreate, FuelLogUpdate } from '@/types/fuel';

const key = (bikeId: string) => ['bikes', bikeId, 'fuel'] as const;

export const useFuelLogs = (bikeId: string) =>
  useQuery({ queryKey: key(bikeId), queryFn: () => api.listFuelLogs(bikeId), enabled: !!bikeId });

export function useCreateFuelLog(bikeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FuelLogCreate) => api.createFuelLog(bikeId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bikeId) }),
  });
}

export function useUpdateFuelLog(bikeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FuelLogUpdate }) => api.updateFuelLog(bikeId, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bikeId) }),
  });
}

export function useDeleteFuelLog(bikeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteFuelLog(bikeId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bikeId) }),
  });
}
