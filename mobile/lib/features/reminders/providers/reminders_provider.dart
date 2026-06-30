import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/reminder.dart';
import '../../../core/services/reminder_service.dart';

final remindersProvider =
    FutureProvider.autoDispose.family<List<Reminder>, String>((ref, bikeId) async {
  final service = ref.watch(reminderServiceProvider);
  return service.getReminders(bikeId);
});

class ReminderNotifier extends StateNotifier<AsyncValue<void>> {
  final ReminderService _service;
  final Ref _ref;
  final String bikeId;

  ReminderNotifier(this._service, this._ref, this.bikeId)
      : super(const AsyncValue.data(null));

  Future<bool> createReminder(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      await _service.createReminder(bikeId, data);
      _ref.invalidate(remindersProvider(bikeId));
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> deleteReminder(String id) async {
    state = const AsyncValue.loading();
    try {
      await _service.deleteReminder(id);
      _ref.invalidate(remindersProvider(bikeId));
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }
}

final reminderNotifierProvider = StateNotifierProvider.autoDispose
    .family<ReminderNotifier, AsyncValue<void>, String>((ref, bikeId) {
  final service = ref.watch(reminderServiceProvider);
  return ReminderNotifier(service, ref, bikeId);
});
