import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/stats.dart';
import '../../../core/services/stats_service.dart';

final statsProvider =
    FutureProvider.autoDispose.family<BikeStats, String>((ref, bikeId) async {
  final service = ref.watch(statsServiceProvider);
  return service.getStats(bikeId);
});
