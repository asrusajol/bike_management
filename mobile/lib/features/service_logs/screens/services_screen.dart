import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/service_provider.dart';
import '../../bikes/providers/bikes_provider.dart';
import '../../../core/models/service_log.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/loading_spinner.dart';
import '../../../shared/widgets/empty_state_widget.dart';

class ServicesScreen extends ConsumerWidget {
  const ServicesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeBikeAsync = ref.watch(activeBikeProvider);

    return activeBikeAsync.when(
      loading: () => const LoadingSpinner(),
      error: (e, _) => Center(child: Text(e.toString())),
      data: (bike) {
        if (bike == null) {
          return const EmptyStateWidget(
            icon: Icons.build_outlined,
            title: 'No bike selected',
            description: 'Add a bike first to track service logs',
          );
        }
        return _ServicesContent(bikeId: bike.id);
      },
    );
  }
}

class _ServicesContent extends ConsumerWidget {
  final String bikeId;

  const _ServicesContent({required this.bikeId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logsAsync = ref.watch(serviceLogsProvider(bikeId));

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/service/new?bike_id=$bikeId'),
        child: const Icon(Icons.add),
      ),
      body: logsAsync.when(
        loading: () => const LoadingSpinner(),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (logs) {
          if (logs.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.build_outlined,
              title: 'No service logs yet',
              description: 'Tap the + button to log a service.',
            );
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(serviceLogsProvider(bikeId).future),
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: logs.length,
              itemBuilder: (context, index) {
                return ServiceLogCard(
                  log: logs[index],
                  onDelete: () async {
                    await ref
                        .read(serviceLogNotifierProvider(bikeId).notifier)
                        .deleteServiceLog(logs[index].id);
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

class ServiceLogCard extends StatelessWidget {
  final ServiceLog log;
  final VoidCallback onDelete;

  const ServiceLogCard(
      {super.key, required this.log, required this.onDelete});

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
                        color: AppColors.serviceColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.build,
                          color: AppColors.serviceColor, size: 20),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          Formatters.formatDate(log.loggedAt),
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        if (log.workshopName != null)
                          Text(log.workshopName!,
                              style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ],
                ),
                Row(
                  children: [
                    Text(
                      Formatters.formatCurrency(log.cost),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: AppColors.serviceColor,
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
            if (log.serviceItems.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: log.serviceItems
                    .map((item) => _serviceChip(item))
                    .toList(),
              ),
            ],
            if (log.nextServiceKm != null || log.nextServiceDate != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.schedule,
                      size: 14, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    'Next: ${log.nextServiceKm != null ? '${log.nextServiceKm!.toStringAsFixed(0)} km' : ''}'
                    '${log.nextServiceDate != null ? '  ${Formatters.formatDate(log.nextServiceDate!)}' : ''}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _serviceChip(ServiceItem item) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.serviceColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
            color: AppColors.serviceColor.withValues(alpha: 0.3)),
      ),
      child: Text(
        '${item.name}  ₹${item.cost.toStringAsFixed(0)}',
        style: const TextStyle(
          fontSize: 11,
          color: AppColors.serviceColor,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
