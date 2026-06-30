import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/fuel_provider.dart';
import '../../bikes/providers/bikes_provider.dart';
import '../../../core/models/fuel_log.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/loading_spinner.dart';
import '../../../shared/widgets/empty_state_widget.dart';

class FuelScreen extends ConsumerWidget {
  const FuelScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeBikeAsync = ref.watch(activeBikeProvider);

    return activeBikeAsync.when(
      loading: () => const LoadingSpinner(),
      error: (e, _) => Center(child: Text(e.toString())),
      data: (bike) {
        if (bike == null) {
          return const EmptyStateWidget(
            icon: Icons.local_gas_station_outlined,
            title: 'No bike selected',
            description: 'Add a bike first to track fuel logs',
          );
        }
        return _FuelContent(bikeId: bike.id);
      },
    );
  }
}

class _FuelContent extends ConsumerWidget {
  final String bikeId;

  const _FuelContent({required this.bikeId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logsAsync = ref.watch(fuelLogsProvider(bikeId));

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/fuel/new?bike_id=$bikeId'),
        child: const Icon(Icons.add),
      ),
      body: logsAsync.when(
        loading: () => const LoadingSpinner(),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (logs) {
          if (logs.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.local_gas_station_outlined,
              title: 'No fuel logs yet',
              description: 'Tap the + button to add your first fuel entry.',
            );
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(fuelLogsProvider(bikeId).future),
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: logs.length,
              itemBuilder: (context, index) {
                return FuelLogCard(
                  log: logs[index],
                  onDelete: () async {
                    await ref
                        .read(createFuelLogProvider(bikeId).notifier)
                        .deleteFuelLog(logs[index].id);
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class FuelLogCard extends StatelessWidget {
  final FuelLog log;
  final VoidCallback onDelete;

  const FuelLogCard({super.key, required this.log, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.fuelColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.local_gas_station,
                          color: AppColors.fuelColor, size: 20),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          Formatters.formatDate(log.loggedAt),
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        if (log.stationName != null)
                          Text(log.stationName!,
                              style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ],
                ),
                Row(
                  children: [
                    Text(
                      Formatters.formatCurrency(log.totalCost),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: AppColors.fuelColor,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline,
                          color: AppColors.error, size: 20),
                      onPressed: onDelete,
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                _badge(
                    '${log.fuelQuantity.toStringAsFixed(1)} L',
                    AppColors.fuelColor),
                const SizedBox(width: 8),
                _badge(
                    '₹${log.fuelPricePerUnit.toStringAsFixed(2)}/L',
                    AppColors.textSecondary),
                const SizedBox(width: 8),
                _badge(
                    '${log.odometerReading.toStringAsFixed(0)} km',
                    AppColors.info),
                if (log.fuelEfficiency != null) ...[
                  const SizedBox(width: 8),
                  _badge(
                      '${log.fuelEfficiency!.toStringAsFixed(1)} km/L',
                      AppColors.secondary),
                ],
              ],
            ),
            if (log.isFullTank) ...[
              const SizedBox(height: 6),
              _badge('Full Tank', AppColors.primary),
            ],
          ],
        ),
      ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: color,
        ),
      ),
    );
  }
}
