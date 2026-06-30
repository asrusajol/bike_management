import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/bikes_provider.dart';
import '../../../core/models/bike.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/loading_spinner.dart';
import '../../../shared/widgets/empty_state_widget.dart';
import '../../../shared/widgets/error_message.dart';

class BikesScreen extends ConsumerWidget {
  const BikesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bikesAsync = ref.watch(bikesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Bikes'),
        centerTitle: false,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/bikes/new'),
        child: const Icon(Icons.add),
      ),
      body: bikesAsync.when(
        loading: () => const LoadingSpinner(),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: ErrorMessage(message: err.toString()),
          ),
        ),
        data: (bikes) {
          if (bikes.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.motorcycle_outlined,
              title: 'No bikes yet',
              description: 'Tap the + button to add your first bike.',
            );
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(bikesProvider.future),
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: bikes.length,
              itemBuilder: (context, index) {
                return BikeCard(
                  bike: bikes[index],
                  onDelete: () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Delete Bike'),
                        content: Text(
                            'Delete "${bikes[index].name}"? This cannot be undone.'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(ctx, false),
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(ctx, true),
                            style: TextButton.styleFrom(
                              foregroundColor: AppColors.error,
                            ),
                            child: const Text('Delete'),
                          ),
                        ],
                      ),
                    );
                    if (confirm == true) {
                      await ref
                          .read(bikeNotifierProvider.notifier)
                          .deleteBike(bikes[index].id);
                      ref.invalidate(bikesProvider);
                    }
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

class BikeCard extends StatelessWidget {
  final Bike bike;
  final VoidCallback onDelete;

  const BikeCard({
    super.key,
    required this.bike,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {},
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.motorcycle,
                  color: AppColors.primary,
                  size: 26,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      bike.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    if (bike.make != null || bike.model != null)
                      Text(
                        bike.displayName,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      children: [
                        if (bike.cc != null)
                          _chip('${bike.cc} cc', AppColors.primary),
                        if (bike.plateNumber != null)
                          _chip(bike.plateNumber!, AppColors.textSecondary),
                        if (bike.year != null)
                          _chip('${bike.year}', AppColors.info),
                      ],
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                onSelected: (val) {
                  if (val == 'delete') onDelete();
                },
                itemBuilder: (ctx) => const [
                  PopupMenuItem(
                    value: 'delete',
                    child: Text('Delete',
                        style: TextStyle(color: AppColors.error)),
                  ),
                ],
                icon: const Icon(Icons.more_vert, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _chip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: color,
        ),
      ),
    );
  }
}
