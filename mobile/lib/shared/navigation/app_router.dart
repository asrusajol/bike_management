import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/bikes/screens/bikes_screen.dart';
import '../../features/bikes/screens/bike_form_screen.dart';
import '../../features/fuel/screens/fuel_form_screen.dart';
import '../../features/service_logs/screens/service_form_screen.dart';
import '../../features/expenses/screens/expense_form_screen.dart';
import '../../features/main/screens/main_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final listenable = _AuthStateListenable();

  ref.listen<AuthState>(authProvider, (_, next) {
    listenable.notify();
  });

  return GoRouter(
    initialLocation: '/',
    refreshListenable: listenable,
    redirect: (BuildContext context, GoRouterState state) {
      final authState = ref.read(authProvider);
      final isAuth = authState.isAuthenticated;
      final isLoading = authState.isLoading;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');

      // Don't redirect while loading initial auth state
      if (isLoading) return null;

      if (!isAuth && !isAuthRoute) return '/auth/login';
      if (isAuth && isAuthRoute) return '/';
      return null;
    },
    routes: [
      // Main shell
      GoRoute(
        path: '/',
        builder: (context, state) => const MainScreen(),
      ),

      // Auth routes
      GoRoute(
        path: '/auth/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/auth/register',
        builder: (context, state) => const RegisterScreen(),
      ),

      // Bikes routes
      GoRoute(
        path: '/bikes',
        builder: (context, state) => const BikesScreen(),
      ),
      GoRoute(
        path: '/bikes/new',
        builder: (context, state) => const BikeFormScreen(),
      ),
      GoRoute(
        path: '/bikes/:id/edit',
        builder: (context, state) {
          final id = state.pathParameters['id'];
          return BikeFormScreen(bikeId: id);
        },
      ),

      // Fuel routes
      GoRoute(
        path: '/fuel/new',
        builder: (context, state) {
          final bikeId = state.uri.queryParameters['bike_id'] ?? '';
          return FuelFormScreen(bikeId: bikeId);
        },
      ),

      // Service routes
      GoRoute(
        path: '/service/new',
        builder: (context, state) {
          final bikeId = state.uri.queryParameters['bike_id'] ?? '';
          return ServiceFormScreen(bikeId: bikeId);
        },
      ),

      // Expense routes
      GoRoute(
        path: '/expense/new',
        builder: (context, state) {
          final bikeId = state.uri.queryParameters['bike_id'] ?? '';
          return ExpenseFormScreen(bikeId: bikeId);
        },
      ),
    ],
  );
});

/// Helper to make GoRouter react to AuthState changes
class _AuthStateListenable extends ChangeNotifier {
  void notify() => notifyListeners();
}
