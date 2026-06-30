import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/expenses';
import type { ExpenseCreate } from '@/types/expense';

const key = (bikeId: string) => ['bikes', bikeId, 'expenses'] as const;

export const useExpenses = (bikeId: string) =>
  useQuery({ queryKey: key(bikeId), queryFn: () => api.listExpenses(bikeId), enabled: !!bikeId });

export function useCreateExpense(bikeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExpenseCreate) => api.createExpense(bikeId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bikeId) }),
  });
}

export function useDeleteExpense(bikeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteExpense(bikeId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bikeId) }),
  });
}
