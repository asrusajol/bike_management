import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/stats_provider.dart';
import '../../bikes/providers/bikes_provider.dart';
import '../../../core/models/stats.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/loading_spinner.dart';
import '../../../shared/widgets/empty_state_widget.dart';
import '../../../shared/widgets/stat_card.dart';

class StatsScreen extends ConsumerWidget {
  const StatsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeBikeAsync = ref.watch(activeBikeProvider);

    return activeBikeAsync.when(
      loading: () => const LoadingSpinner(),
      error: (e, _) => Center(child: Text(e.toString())),
      data: (bike) {
        if (bike == null) {
          return const EmptyStateWidget(
            icon: Icons.bar_chart_outlined,
            title: 'No bike selected',
            description: 'Add a bike to view statistics',
          );
        }
        final statsAsync = ref.watch(statsProvider(bike.id));
        return statsAsync.when(
          loading: () => const LoadingSpinner(),
          error: (e, _) => Center(
            child: Text('Error loading stats: $e'),
          ),
          data: (stats) => _StatsContent(stats: stats),
        );
      },
    );
  }
}

class _StatsContent extends StatelessWidget {
  final BikeStats stats;

  const _StatsContent({required this.stats});

  @override
  Widget build(BuildContext context) {
    final summary = stats.summary;
    final total = summary.totalCost;
    final fuelPct =
        total > 0 ? (summary.totalFuelCost / total * 100).round() : 0;
    final svcPct =
        total > 0 ? (summary.totalServiceCost / total * 100).round() : 0;
    final expPct = total > 0
        ? (100 - fuelPct - svcPct)
        : 0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary cards
          Text('Cost Summary', style: Theme.of(context).textTheme.titleLarge),
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
                value: Formatters.formatCurrency(summary.totalCost),
                accentColor: AppColors.primary,
                icon: Icons.account_balance_wallet_outlined,
              ),
              StatCard(
                label: 'Fuel',
                value: Formatters.formatCurrency(summary.totalFuelCost),
                accentColor: AppColors.fuelColor,
                icon: Icons.local_gas_station_outlined,
                subtitle: '$fuelPct% of total',
              ),
              StatCard(
                label: 'Service',
                value: Formatters.formatCurrency(summary.totalServiceCost),
                accentColor: AppColors.serviceColor,
                icon: Icons.build_outlined,
                subtitle: '$svcPct% of total',
              ),
              StatCard(
                label: 'Other',
                value: Formatters.formatCurrency(summary.totalExpenseCost),
                accentColor: AppColors.expenseColor,
                icon: Icons.receipt_outlined,
                subtitle: '$expPct% of total',
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Performance metrics
          Text('Performance', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                if (summary.totalKmRun != null)
                  _metricRow(context, 'Total km Tracked',
                      '${Formatters.formatNumber(summary.totalKmRun!, decimals: 0)} km'),
                if (summary.daysTracked != null)
                  _metricRow(context, 'Days Tracked',
                      '${summary.daysTracked} days'),
                if (summary.dailyAvgKm != null)
                  _metricRow(context, 'Daily Avg km',
                      '${summary.dailyAvgKm!.toStringAsFixed(1)} km/day'),
                if (stats.avgFuelEfficiency != null)
                  _metricRow(context, 'Avg Fuel Efficiency',
                      '${stats.avgFuelEfficiency!.toStringAsFixed(1)} km/L'),
                if (stats.costPerKm != null)
                  _metricRow(context, 'Cost per km',
                      '₹${stats.costPerKm!.toStringAsFixed(2)}'),
                if (summary.fuelMinEfficiency != null &&
                    summary.fuelMaxEfficiency != null)
                  _metricRow(
                    context,
                    'Efficiency Range',
                    '${summary.fuelMinEfficiency!.toStringAsFixed(1)} – ${summary.fuelMaxEfficiency!.toStringAsFixed(1)} km/L',
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Monthly cost line chart
          if (stats.monthly.isNotEmpty) ...[
            Text('Monthly Costs',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            _MonthlyLineChart(monthly: stats.monthly),
            const SizedBox(height: 20),
          ],

          // Cost distribution pie chart
          if (total > 0) ...[
            Text('Cost Distribution',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            _CostPieChart(
              fuelCost: summary.totalFuelCost,
              serviceCost: summary.totalServiceCost,
              expenseCost: summary.totalExpenseCost,
            ),
            const SizedBox(height: 20),
          ],

          // Expense by category
          if (stats.expenseByCategory.isNotEmpty) ...[
            Text('Expense Breakdown',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            ...stats.expenseByCategory.map((e) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(e.category,
                            style:
                                Theme.of(context).textTheme.bodyMedium),
                      ),
                      Text(
                        Formatters.formatCurrency(e.cost),
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                )),
          ],
        ],
      ),
    );
  }

  Widget _metricRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  )),
          Text(value,
              style: Theme.of(context).textTheme.titleMedium),
        ],
      ),
    );
  }
}

class _MonthlyLineChart extends StatelessWidget {
  final List<MonthlyStats> monthly;

  const _MonthlyLineChart({required this.monthly});

  @override
  Widget build(BuildContext context) {
    final displayData =
        monthly.length > 6 ? monthly.sublist(monthly.length - 6) : monthly;
    final maxY =
        displayData.map((e) => e.totalCost).reduce((a, b) => a > b ? a : b) *
            1.2;

    return Container(
      height: 200,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: LineChart(
        LineChartData(
          minY: 0,
          maxY: maxY,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (_) =>
                const FlLine(color: AppColors.border, strokeWidth: 1),
          ),
          borderData: FlBorderData(show: false),
          titlesData: FlTitlesData(
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (value, _) {
                  final idx = value.toInt();
                  if (idx < 0 || idx >= displayData.length) {
                    return const SizedBox.shrink();
                  }
                  final parts = displayData[idx].month.split('-');
                  final monthNum = int.tryParse(parts.length > 1 ? parts[1] : '1') ?? 1;
                  return Text(_monthAbbr(monthNum),
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
          lineBarsData: [
            LineChartBarData(
              spots: displayData.asMap().entries.map((entry) {
                return FlSpot(
                    entry.key.toDouble(), entry.value.totalCost);
              }).toList(),
              isCurved: true,
              color: AppColors.primary,
              barWidth: 3,
              belowBarData: BarAreaData(
                show: true,
                color: AppColors.primary.withValues(alpha: 0.1),
              ),
              dotData: const FlDotData(show: false),
            ),
          ],
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

class _CostPieChart extends StatelessWidget {
  final double fuelCost;
  final double serviceCost;
  final double expenseCost;

  const _CostPieChart({
    required this.fuelCost,
    required this.serviceCost,
    required this.expenseCost,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 220,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: PieChart(
              PieChartData(
                sectionsSpace: 2,
                centerSpaceRadius: 40,
                sections: [
                  if (fuelCost > 0)
                    PieChartSectionData(
                      value: fuelCost,
                      color: AppColors.fuelColor,
                      title: '',
                      radius: 50,
                    ),
                  if (serviceCost > 0)
                    PieChartSectionData(
                      value: serviceCost,
                      color: AppColors.serviceColor,
                      title: '',
                      radius: 50,
                    ),
                  if (expenseCost > 0)
                    PieChartSectionData(
                      value: expenseCost,
                      color: AppColors.expenseColor,
                      title: '',
                      radius: 50,
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 16),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _legend('Fuel', AppColors.fuelColor, fuelCost),
              const SizedBox(height: 10),
              _legend('Service', AppColors.serviceColor, serviceCost),
              const SizedBox(height: 10),
              _legend('Expenses', AppColors.expenseColor, expenseCost),
            ],
          ),
        ],
      ),
    );
  }

  Widget _legend(String label, Color color, double value) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary)),
            Text(Formatters.formatCurrency(value),
                style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary)),
          ],
        ),
      ],
    );
  }
}
