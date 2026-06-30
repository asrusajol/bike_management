import 'package:intl/intl.dart';

class Formatters {
  static final _currencyFormat = NumberFormat.currency(
    symbol: '₹',
    locale: 'en_IN',
    decimalDigits: 2,
  );

  static final _dateFormat = DateFormat('MMM d, yyyy');
  static final _datetimeFormat = DateFormat('MMM d, yyyy, h:mm a');
  static final _shortDateFormat = DateFormat('MMM d');
  static final _monthYearFormat = DateFormat('MMM yyyy');

  static String formatCurrency(double amount) {
    return _currencyFormat.format(amount);
  }

  static String formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      return _dateFormat.format(dt.toLocal());
    } catch (_) {
      return iso;
    }
  }

  static String formatDatetime(String iso) {
    try {
      final dt = DateTime.parse(iso);
      return _datetimeFormat.format(dt.toLocal());
    } catch (_) {
      return iso;
    }
  }

  static String formatShortDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      return _shortDateFormat.format(dt.toLocal());
    } catch (_) {
      return iso;
    }
  }

  static String formatMonthYear(String iso) {
    try {
      final dt = DateTime.parse('$iso-01');
      return _monthYearFormat.format(dt);
    } catch (_) {
      return iso;
    }
  }

  static String formatNumber(double value, {int decimals = 1}) {
    if (value == value.truncateToDouble()) {
      return value.toInt().toString();
    }
    return value.toStringAsFixed(decimals);
  }

  static String formatOdometer(double km, String unit) {
    return '${NumberFormat('#,##0').format(km)} $unit';
  }

  static String formatEfficiency(double? efficiency, String unit) {
    if (efficiency == null) return '--';
    return '${efficiency.toStringAsFixed(1)} km/L';
  }
}
