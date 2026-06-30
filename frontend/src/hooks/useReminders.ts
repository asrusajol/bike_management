import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/reminders';
import type { ReminderCreate, ReminderUpdate } from '@/types/reminder';

const key = (bikeId: string) => ['bikes', bikeId, 'reminders'] as const;

export const useReminders = (bikeId: string) =>
  useQuery({ queryKey: key(bikeId), queryFn: () => api.listReminders(bikeId), enabled: !!bikeId });

export function useCreateReminder(bikeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReminderCreate) => api.createReminder(bikeId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bikeId) }),
  });
}

export function useUpdateReminder(bikeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReminderUpdate }) => api.updateReminder(bikeId, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bikeId) }),
  });
}

export function useDeleteReminder(bikeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteReminder(bikeId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bikeId) }),
  });
}
