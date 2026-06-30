import { useQuery } from '@tanstack/react-query';
import { getBikeStats } from '@/api/stats';

export const useStats = (bikeId: string) =>
  useQuery({
    queryKey: ['bikes', bikeId, 'stats'],
    queryFn: () => getBikeStats(bikeId),
    enabled: !!bikeId,
  });
