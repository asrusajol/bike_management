import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_constants.dart';
import '../models/bike.dart';

class BikeService {
  final Dio _dio;

  BikeService(this._dio);

  Future<List<Bike>> getBikes() async {
    final response = await _dio.get(ApiConstants.bikes);
    final data = response.data as List<dynamic>;
    return data
        .map((e) => Bike.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Bike> getBike(String id) async {
    final response = await _dio.get(ApiConstants.bike(id));
    return Bike.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Bike> createBike(Map<String, dynamic> data) async {
    final response = await _dio.post(ApiConstants.bikes, data: data);
    return Bike.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Bike> updateBike(String id, Map<String, dynamic> data) async {
    final response = await _dio.put(ApiConstants.bike(id), data: data);
    return Bike.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteBike(String id) async {
    await _dio.delete(ApiConstants.bike(id));
  }
}

final bikeServiceProvider = Provider<BikeService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return BikeService(dio);
});
