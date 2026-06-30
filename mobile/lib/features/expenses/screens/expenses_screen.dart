import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/expenses_provider.dart';
import '../../bikes/providers/bikes_provider.dart';
import '../../../core/models/expense.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/loading_spinner.dart';
import '../../../shared/widgets/empty_state_widget.dart';

class ExpensesScreen extends ConsumerWidget {
  const ExpensesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeBikeAsync = ref.watch(activeBikeProvider);

    return activeBikeAsync.when(
      loading: () => const LoadingSpinner(),
      error: (e, _) => Center(child: Text(e.toString())),
      data: (bike) {
        if (bike == null) {
          return const EmptyStateWidget(
            icon: Icons.receipt_outlined,
            title: 'No bike selected',
            description: 'Add a bike first to track expenses',
          );
        }
        return _ExpensesContent(bikeId: bike.id);
      },
    );
  }
}

class _ExpensesContent extends ConsumerWidget {
  final String bikeId;

  const _ExpensesContent({required this.bikeId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expensesAsync = ref.watch(expensesProvider(bikeId));

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/expense/new?bike_id=$bikeId'),
        child: const Icon(Icons.add),
      ),
      body: expensesAsync.when(
        loading: () => const LoadingSpinner(),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (expenses) {
          if (expenses.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.receipt_outlined,
              title: 'No expenses yet',
              description: 'Tap the + button to record an expense.',
            );
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(expensesProvider(bikeId).future),
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: expenses.length,
              itemBuilder: (context, index) {
                return ExpenseCard(
                  expense: expenses[index],
                  onDelete: () async {
                    await ref
                        .read(expenseNotifierProvider(bikeId).notifier)
                        .deleteExpense(expenses[index].id);
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

Color _categoryColor(ExpenseCategory cat) {
  switch (cat) {
    case ExpenseCategory.insurance:
      return const Color(0xFF3B82F6); // blue
    case ExpenseCategory.tax:
      return const Color(0xFF8B5CF6); // violet
    case ExpenseCategory.parking:
      return const Color(0xFF06B6D4); // cyan
    case ExpenseCategory.accessories:
      return const Color(0xFFF59E0B); // amber
    case ExpenseCategory.repair:
      return AppColors.error;
    case ExpenseCategory.cleaning:
      return const Color(0xFF14B8A6); // teal
    case ExpenseCategory.fine:
      return const Color(0xFFEF4444); // red
    case ExpenseCategory.other:
      return AppColors.textSecondary;
  }
}

class ExpenseCard extends StatelessWidget {
  final Expense expense;
  final VoidCallback onDelete;

  const ExpenseCard({super.key, required this.expense, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final color = _categoryColor(expense.category);
    final label = expenseCategoryLabel[expense.category] ?? 'Other';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(Icons.receipt, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          label,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: color,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        Formatters.formatDate(expense.loggedAt),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                  if (expense.description != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      expense.description!,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                  if (expense.notes != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      expense.notes!,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  Formatters.formatCurrency(expense.cost),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.expenseColor,
                      ),
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline,
                      color: AppColors.error, size: 20),
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
}
