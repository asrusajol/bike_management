import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/stats.dart';
import '../../../core/models/bike.dart';
import '../../bikes/providers/bikes_provider.dart';
import '../../stats/providers/stats_provider.dart';

class DashboardState {
  final Bike? activeBike;
  final BikeStats? stats;
  final bool isLoading;
  final String? error;

  const DashboardState({
    this.activeBike,
    this.stats,
    this.isLoading = false,
    this.error,
  });
}

final dashboardProvider = Provider.autoDispose<DashboardState>((ref) {
  final activeBikeAsync = ref.watch(activeBikeProvider);

  return activeBikeAsync.when(
    loading: () => const DashboardState(isLoading: true),
    error: (e, _) => DashboardState(error: e.toString()),
    data: (bike) {
      if (bike == null) {
        return const DashboardState();
      }
      final statsAsync = ref.watch(statsProvider(bike.id));
      return statsAsync.when(
        loading: () => DashboardState(activeBike: bike, isLoading: true),
        error: (e, _) =>
            DashboardState(activeBike: bike, error: e.toString()),
        data: (stats) => DashboardState(activeBike: bike, stats: stats),
      );
    },
  );
});
