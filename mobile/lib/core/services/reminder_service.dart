import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_constants.dart';
import '../models/reminder.dart';

class ReminderService {
  final Dio _dio;

  ReminderService(this._dio);

  Future<List<Reminder>> getReminders(String bikeId) async {
    final response = await _dio.get(
      ApiConstants.reminders,
      queryParameters: {'bike_id': bikeId},
    );
    final data = response.data as List<dynamic>;
    return data
        .map((e) => Reminder.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Reminder> createReminder(
      String bikeId, Map<String, dynamic> data) async {
    final response = await _dio.post(
      ApiConstants.reminders,
      queryParameters: {'bike_id': bikeId},
      data: data,
    );
    return Reminder.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteReminder(String id) async {
    await _dio.delete(ApiConstants.reminder(id));
  }
}

final reminderServiceProvider = Provider<ReminderService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return ReminderService(dio);
});
