import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_constants.dart';
import '../models/stats.dart';

class StatsService {
  final Dio _dio;

  StatsService(this._dio);

  Future<BikeStats> getStats(String bikeId) async {
    final response = await _dio.get(
      ApiConstants.stats,
      queryParameters: {'bike_id': bikeId},
    );
    return BikeStats.fromJson(response.data as Map<String, dynamic>);
  }
}

final statsServiceProvider = Provider<StatsService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return StatsService(dio);
});
