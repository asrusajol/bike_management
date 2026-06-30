import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_constants.dart';
import '../models/fuel_log.dart';

class FuelService {
  final Dio _dio;

  FuelService(this._dio);

  Future<List<FuelLog>> getFuelLogs(String bikeId) async {
    final response = await _dio.get(
      ApiConstants.fuelLogs,
      queryParameters: {'bike_id': bikeId},
    );
    final data = response.data as List<dynamic>;
    return data
        .map((e) => FuelLog.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<FuelLog> createFuelLog(
      String bikeId, Map<String, dynamic> data) async {
    final response = await _dio.post(
      ApiConstants.fuelLogs,
      queryParameters: {'bike_id': bikeId},
      data: data,
    );
    return FuelLog.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteFuelLog(String id) async {
    await _dio.delete(ApiConstants.fuelLog(id));
  }
}

final fuelServiceProvider = Provider<FuelService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return FuelService(dio);
});
