import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/fuel_log.dart';
import '../../../core/services/fuel_service.dart';

final fuelLogsProvider =
    FutureProvider.autoDispose.family<List<FuelLog>, String>((ref, bikeId) async {
  final service = ref.watch(fuelServiceProvider);
  return service.getFuelLogs(bikeId);
});

class FuelLogNotifier extends StateNotifier<AsyncValue<void>> {
  final FuelService _service;
  final Ref _ref;
  final String bikeId;

  FuelLogNotifier(this._service, this._ref, this.bikeId)
      : super(const AsyncValue.data(null));

  Future<bool> createFuelLog(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      await _service.createFuelLog(bikeId, data);
      _ref.invalidate(fuelLogsProvider(bikeId));
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> deleteFuelLog(String id) async {
    state = const AsyncValue.loading();
    try {
      await _service.deleteFuelLog(id);
      _ref.invalidate(fuelLogsProvider(bikeId));
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }
}

final createFuelLogProvider = StateNotifierProvider.autoDispose
    .family<FuelLogNotifier, AsyncValue<void>, String>((ref, bikeId) {
  final service = ref.watch(fuelServiceProvider);
  return FuelLogNotifier(service, ref, bikeId);
});
