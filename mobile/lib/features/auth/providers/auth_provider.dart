import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/storage/secure_storage.dart';

class AuthState {
  final String? accessToken;
  final String? refreshToken;
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.accessToken,
    this.refreshToken,
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    String? accessToken,
    String? refreshToken,
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final SecureStorage _secureStorage;

  AuthNotifier(this._authService, this._secureStorage)
      : super(const AuthState()) {
    loadFromStorage();
  }

  Future<void> loadFromStorage() async {
    state = state.copyWith(isLoading: true);
    try {
      final accessToken = await _secureStorage.getAccessToken();
      final refreshToken = await _secureStorage.getRefreshToken();
      if (accessToken != null && refreshToken != null) {
        state = AuthState(
          accessToken: accessToken,
          refreshToken: refreshToken,
          isAuthenticated: true,
          isLoading: false,
        );
      } else {
        state = const AuthState(isLoading: false);
      }
    } catch (_) {
      state = const AuthState(isLoading: false);
    }
  }

  Future<bool> login({required String email, required String password}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final tokens = await _authService.login(email: email, password: password);
      await _secureStorage.saveTokens(
        accessToken: tokens['access_token']!,
        refreshToken: tokens['refresh_token']!,
      );
      state = AuthState(
        accessToken: tokens['access_token'],
        refreshToken: tokens['refresh_token'],
        isAuthenticated: true,
        isLoading: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: _extractErrorMessage(e),
      );
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String fullName,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final tokens = await _authService.register(
        email: email,
        password: password,
        fullName: fullName,
      );
      await _secureStorage.saveTokens(
        accessToken: tokens['access_token']!,
        refreshToken: tokens['refresh_token']!,
      );
      state = AuthState(
        accessToken: tokens['access_token'],
        refreshToken: tokens['refresh_token'],
        isAuthenticated: true,
        isLoading: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: _extractErrorMessage(e),
      );
      return false;
    }
  }

  Future<void> logout() async {
    await _secureStorage.clearTokens();
    state = const AuthState();
  }

  String _extractErrorMessage(Object e) {
    try {
      final dioE = e as dynamic;
      final message = dioE.response?.data?['detail'];
      if (message is String) return message;
      return message?.toString() ?? 'An error occurred';
    } catch (_) {
      return e.toString();
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  final secureStorage = ref.watch(secureStorageProvider);
  return AuthNotifier(authService, secureStorage);
});
