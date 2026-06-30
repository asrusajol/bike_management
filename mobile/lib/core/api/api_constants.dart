import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConstants {
  static String get baseUrl =>
      dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:8000/api/v1';

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refresh = '/auth/refresh';

  // Bikes
  static const String bikes = '/bikes';
  static String bike(String id) => '/bikes/$id';

  // Fuel logs
  static const String fuelLogs = '/fuel-logs';
  static String fuelLog(String id) => '/fuel-logs/$id';

  // Service logs
  static const String serviceLogs = '/service-logs';
  static String serviceLog(String id) => '/service-logs/$id';

  // Expenses
  static const String expenses = '/expenses';
  static String expense(String id) => '/expenses/$id';

  // Reminders
  static const String reminders = '/reminders';
  static String reminder(String id) => '/reminders/$id';

  // Stats
  static const String stats = '/stats';
}
