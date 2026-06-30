import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/dashboard_provider.dart';
import '../../bikes/providers/bikes_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/models/stats.dart';
import '../../../shared/widgets/loading_spinner.dart';
import '../../../shared/widgets/empty_state_widget.dart';
import '../../../shared/widgets/stat_card.dart';
import '../../../shared/widgets/bike_selector_sheet.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(dashboardProvider);

    if (dashboard.isLoading) return const LoadingSpinner();

    if (dashboard.activeBike == null) {
      return EmptyStateWidget(
        icon: Icons.motorcycle_outlined,
        title: 'No bikes added',
        description: 'Add your first bike to start tracking',
        action: TextButton(
          onPressed: () => context.push('/bikes/new'),
          child: const Text('Add Bike'),
        ),
      );
    }

    final bike = dashboard.activeBike!;
    final stats = dashboard.stats;
    final summary = stats?.summary;

    return RefreshIndicator(
      onRefresh: () async {
        if (stats != null) {
          ref.invalidate(statsProvider(bike.id));
        }
        ref.invalidate(bikesProvider);
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Bike selector header
            GestureDetector(
              onTap: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  shape: const RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(20)),
                  ),
                  builder: (_) => const BikeSelectorSheet(),
                );
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.motorcycle, color: AppColors.primary, size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            bike.name,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          if (bike.make != null)
                            Text(
                              bike.displayName,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                        ],
                      ),
                    ),
                    const Icon(Icons.expand_more, color: AppColors.textSecondary),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            if (dashboard.error != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Could not load stats: ${dashboard.error}',
                  style:
                      const TextStyle(color: AppColors.error, fontSize: 13),
                ),
              ),

            // Stat cards
            Text('Overview', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: [
                StatCard(
                  label: 'Total Spend',
                  value: Formatters.formatCurrency(summary?.totalCost ?? 0),
                  accentColor: AppColors.textPrimary,
                  icon: Icons.account_balance_wallet_outlined,
                ),
                StatCard(
                  label: 'Fuel Cost',
                  value:
                      Formatters.formatCurrency(summary?.totalFuelCost ?? 0),
                  accentColor: AppColors.fuelColor,
                  icon: Icons.local_gas_station_outlined,
                  subtitle: '${summary?.fuelLogsCount ?? 0} fill-ups',
                ),
                StatCard(
                  label: 'Service Cost',
                  value: Formatters.formatCurrency(
                      summary?.totalServiceCost ?? 0),
                  accentColor: AppColors.serviceColor,
                  icon: Icons.build_outlined,
                  subtitle: '${summary?.serviceLogsCount ?? 0} services',
                ),
                StatCard(
                  label: 'Other Expenses',
                  value: Formatters.formatCurrency(
                      summary?.totalExpenseCost ?? 0),
                  accentColor: AppColors.expenseColor,
                  icon: Icons.receipt_outlined,
                  subtitle: '${summary?.expenseCount ?? 0} entries',
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Efficiency card
            if (stats?.avgFuelEfficiency != null ||
                stats?.costPerKm != null) ...[
              Text('Performance',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    if (stats?.avgFuelEfficiency != null)
                      Expanded(
                        child: _perfItem(
                          context,
                          'Avg Efficiency',
                          '${stats!.avgFuelEfficiency!.toStringAsFixed(1)} km/L',
                          Icons.speed_outlined,
                          AppColors.secondary,
                        ),
                      ),
                    if (stats?.costPerKm != null)
                      Expanded(
                        child: _perfItem(
                          context,
                          'Cost / km',
                          '₹${stats!.costPerKm!.toStringAsFixed(2)}',
                          Icons.route_outlined,
                          AppColors.primary,
                        ),
                      ),
                    if (summary?.totalKmRun != null)
                      Expanded(
                        child: _perfItem(
                          context,
                          'Total km',
                          Formatters.formatNumber(summary!.totalKmRun!,
                              decimals: 0),
                          Icons.map_outlined,
                          AppColors.info,
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Monthly bar chart
            if (stats != null && stats.monthly.isNotEmpty) ...[
              Text('Monthly Costs',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              _MonthlyChart(monthly: stats.monthly),
              const SizedBox(height: 20),
            ],
          ],
        ),
      ),
    );
  }

  Widget _perfItem(BuildContext context, String label, String value,
      IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 6),
        Text(value,
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.bold)),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _MonthlyChart extends StatelessWidget {
  final List<MonthlyStats> monthly;

  const _MonthlyChart({required this.monthly});

  @override
  Widget build(BuildContext context) {
    final displayData = monthly.length > 6
        ? monthly.sublist(monthly.length - 6)
        : monthly;

    return Container(
      height: 200,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          maxY: displayData
                  .map((e) => e.totalCost)
                  .reduce((a, b) => a > b ? a : b) *
              1.2,
          barTouchData: BarTouchData(
            touchTooltipData: BarTouchTooltipData(
              getTooltipItem: (group, groupIndex, rod, rodIndex) {
                return BarTooltipItem(
                  Formatters.formatCurrency(rod.toY),
                  const TextStyle(color: Colors.white, fontSize: 12),
                );
              },
            ),
          ),
          titlesData: FlTitlesData(
            show: true,
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (value, meta) {
                  final idx = value.toInt();
                  if (idx < 0 || idx >= displayData.length) {
                    return const SizedBox.shrink();
                  }
                  final month = displayData[idx].month;
                  final parts = month.split('-');
                  final label = parts.length >= 2
                      ? _monthAbbr(int.tryParse(parts[1]) ?? 1)
                      : month;
                  return Text(label,
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.textSecondary));
                },
              ),
            ),
            leftTitles: const AxisTitles(
                sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(
                sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(
                sideTitles: SideTitles(showTitles: false)),
          ),
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: displayData
                    .map((e) => e.totalCost)
                    .reduce((a, b) => a > b ? a : b) /
                4,
            getDrawingHorizontalLine: (value) => FlLine(
              color: AppColors.border,
              strokeWidth: 1,
            ),
          ),
          borderData: FlBorderData(show: false),
          barGroups: displayData.asMap().entries.map((entry) {
            return BarChartGroupData(
              x: entry.key,
              barRods: [
                BarChartRodData(
                  toY: entry.value.totalCost,
                  color: AppColors.primary,
                  width: 20,
                  borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(4)),
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  String _monthAbbr(int month) {
    const abbrs = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    if (month < 1 || month > 12) return '';
    return abbrs[month - 1];
  }
}
