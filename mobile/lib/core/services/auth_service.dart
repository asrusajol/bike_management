import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_constants.dart';

class AuthService {
  final Dio _dio;

  AuthService(this._dio);

  Future<Map<String, String>> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post(
      ApiConstants.login,
      data: {
        'email': email,
        'password': password,
      },
    );
    final data = response.data as Map<String, dynamic>;
    return {
      'access_token': data['access_token'] as String,
      'refresh_token': data['refresh_token'] as String,
    };
  }

  Future<Map<String, String>> register({
    required String email,
    required String password,
    required String fullName,
  }) async {
    final response = await _dio.post(
      ApiConstants.register,
      data: {
        'email': email,
        'password': password,
        'full_name': fullName,
      },
    );
    final data = response.data as Map<String, dynamic>;
    return {
      'access_token': data['access_token'] as String,
      'refresh_token': data['refresh_token'] as String,
    };
  }

  Future<Map<String, String>> refreshToken(String token) async {
    final response = await _dio.post(
      ApiConstants.refresh,
      data: {'refresh_token': token},
    );
    final data = response.data as Map<String, dynamic>;
    return {
      'access_token': data['access_token'] as String,
      'refresh_token': data['refresh_token'] as String,
    };
  }
}

final authServiceProvider = Provider<AuthService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return AuthService(dio);
});
