import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/services';
import type { ServiceLogCreate, ServiceLogUpdate } from '@/types/service';

const key = (bikeId: string) => ['bikes', bikeId, 'services'] as const;

export const useServiceLogs = (bikeId: string) =>
  useQuery({ queryKey: key(bikeId), queryFn: () => api.listServiceLogs(bikeId), enabled: !!bikeId });

export function useCreateServiceLog(bikeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ServiceLogCreate) => api.createServiceLog(bikeId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bikeId) }),
  });
}

export function useUpdateServiceLog(bikeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceLogUpdate }) => api.updateServiceLog(bikeId, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bikeId) }),
  });
}

export function useDeleteServiceLog(bikeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteServiceLog(bikeId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bikeId) }),
  });
}
