import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/service_log.dart';
import '../../../core/services/service_log_service.dart';

final serviceLogsProvider =
    FutureProvider.autoDispose.family<List<ServiceLog>, String>((ref, bikeId) async {
  final service = ref.watch(serviceLogServiceProvider);
  return service.getServiceLogs(bikeId);
});

class ServiceLogNotifier extends StateNotifier<AsyncValue<void>> {
  final ServiceLogService _service;
  final Ref _ref;
  final String bikeId;

  ServiceLogNotifier(this._service, this._ref, this.bikeId)
      : super(const AsyncValue.data(null));

  Future<bool> createServiceLog(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      await _service.createServiceLog(bikeId, data);
      _ref.invalidate(serviceLogsProvider(bikeId));
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> deleteServiceLog(String id) async {
    state = const AsyncValue.loading();
    try {
      await _service.deleteServiceLog(id);
      _ref.invalidate(serviceLogsProvider(bikeId));
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }
}

final serviceLogNotifierProvider = StateNotifierProvider.autoDispose
    .family<ServiceLogNotifier, AsyncValue<void>, String>((ref, bikeId) {
  final service = ref.watch(serviceLogServiceProvider);
  return ServiceLogNotifier(service, ref, bikeId);
});
