import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_constants.dart';
import '../models/service_log.dart';

class ServiceLogService {
  final Dio _dio;

  ServiceLogService(this._dio);

  Future<List<ServiceLog>> getServiceLogs(String bikeId) async {
    final response = await _dio.get(
      ApiConstants.serviceLogs,
      queryParameters: {'bike_id': bikeId},
    );
    final data = response.data as List<dynamic>;
    return data
        .map((e) => ServiceLog.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<ServiceLog> createServiceLog(
      String bikeId, Map<String, dynamic> data) async {
    final response = await _dio.post(
      ApiConstants.serviceLogs,
      queryParameters: {'bike_id': bikeId},
      data: data,
    );
    return ServiceLog.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteServiceLog(String id) async {
    await _dio.delete(ApiConstants.serviceLog(id));
  }
}

final serviceLogServiceProvider = Provider<ServiceLogService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return ServiceLogService(dio);
});
