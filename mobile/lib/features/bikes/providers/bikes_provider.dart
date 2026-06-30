import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/bike.dart';
import '../../../core/services/bike_service.dart';

final bikesProvider = FutureProvider.autoDispose<List<Bike>>((ref) async {
  final service = ref.watch(bikeServiceProvider);
  return service.getBikes();
});

final selectedBikeIdProvider = StateProvider<String?>((ref) => null);

final activeBikeProvider = Provider<AsyncValue<Bike?>>((ref) {
  final bikesAsync = ref.watch(bikesProvider);
  final selectedId = ref.watch(selectedBikeIdProvider);

  return bikesAsync.whenData((bikes) {
    if (bikes.isEmpty) return null;
    if (selectedId != null) {
      try {
        return bikes.firstWhere((b) => b.id == selectedId);
      } catch (_) {
        return bikes.first;
      }
    }
    return bikes.first;
  });
});

class BikeNotifier extends StateNotifier<AsyncValue<List<Bike>>> {
  final BikeService _service;
  final Ref _ref;

  BikeNotifier(this._service, this._ref)
      : super(const AsyncValue.loading()) {
    _load();
  }

  Future<void> _load() async {
    try {
      final bikes = await _service.getBikes();
      state = AsyncValue.data(bikes);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refresh() => _load();

  Future<void> deleteBike(String id) async {
    await _service.deleteBike(id);
    _ref.invalidate(bikesProvider);
    await _load();
  }
}

final bikeNotifierProvider =
    StateNotifierProvider.autoDispose<BikeNotifier, AsyncValue<List<Bike>>>(
  (ref) {
    final service = ref.watch(bikeServiceProvider);
    return BikeNotifier(service, ref);
  },
);
