import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/reminders_provider.dart';
import '../../bikes/providers/bikes_provider.dart';
import '../../../core/models/reminder.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/loading_spinner.dart';
import '../../../shared/widgets/empty_state_widget.dart';

class RemindersScreen extends ConsumerWidget {
  const RemindersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeBikeAsync = ref.watch(activeBikeProvider);

    return activeBikeAsync.when(
      loading: () => const LoadingSpinner(),
      error: (e, _) => Center(child: Text(e.toString())),
      data: (bike) {
        if (bike == null) {
          return const EmptyStateWidget(
            icon: Icons.notifications_outlined,
            title: 'No bike selected',
            description: 'Add a bike first to manage reminders',
          );
        }
        return _RemindersContent(bikeId: bike.id);
      },
    );
  }
}

class _RemindersContent extends ConsumerWidget {
  final String bikeId;

  const _RemindersContent({required this.bikeId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final remindersAsync = ref.watch(remindersProvider(bikeId));

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Reminder creation coming soon!')),
          );
        },
        child: const Icon(Icons.add),
      ),
      body: remindersAsync.when(
        loading: () => const LoadingSpinner(),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (reminders) {
          if (reminders.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.notifications_outlined,
              title: 'No reminders yet',
              description: 'Add reminders for service schedules and renewals.',
            );
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(remindersProvider(bikeId).future),
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: reminders.length,
              itemBuilder: (context, index) {
                return ReminderCard(
                  reminder: reminders[index],
                  onDelete: () async {
                    await ref
                        .read(reminderNotifierProvider(bikeId).notifier)
                        .deleteReminder(reminders[index].id);
                  },
                  onToggle: (active) {
                    // Toggle active state - would need an update endpoint
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                          content: Text(
                              'Reminder ${active ? "activated" : "deactivated"}')),
                    );
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

class ReminderCard extends StatelessWidget {
  final Reminder reminder;
  final VoidCallback onDelete;
  final ValueChanged<bool> onToggle;

  const ReminderCard({
    super.key,
    required this.reminder,
    required this.onDelete,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: (reminder.isActive ? AppColors.primary : AppColors.textSecondary)
                    .withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.notifications,
                color: reminder.isActive
                    ? AppColors.primary
                    : AppColors.textSecondary,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    reminder.title,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 6,
                    children: [
                      _badge(reminder.type, AppColors.info),
                      if (reminder.triggerKm != null)
                        _badge(
                            '${reminder.triggerKm!.toStringAsFixed(0)} km',
                            AppColors.primary),
                      if (reminder.triggerDate != null)
                        _badge(
                            Formatters.formatDate(reminder.triggerDate!),
                            AppColors.secondary),
                    ],
                  ),
                  if (reminder.notes != null) ...[
                    const SizedBox(height: 4),
                    Text(reminder.notes!,
                        style: Theme.of(context).textTheme.bodySmall),
                  ],
                ],
              ),
            ),
            Column(
              children: [
                Switch(
                  value: reminder.isActive,
                  onChanged: onToggle,
                  activeColor: AppColors.primary,
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline,
                      color: AppColors.error, size: 18),
                  onPressed: onDelete,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(5),
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
