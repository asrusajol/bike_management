import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/bikes';
import type { BikeCreate, BikeUpdate } from '@/types/bike';

const KEY = ['bikes'] as const;

export const useBikes = () => useQuery({ queryKey: KEY, queryFn: api.listBikes });

export function useCreateBike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BikeCreate) => api.createBike(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateBike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BikeUpdate }) => api.updateBike(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteBike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteBike(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
