class CostSummary {
  final double totalFuelCost;
  final double totalServiceCost;
  final double totalExpenseCost;
  final double totalCost;
  final int fuelLogsCount;
  final int serviceLogsCount;
  final int expenseCount;
  final double? totalKmRun;
  final double? dailyAvgKm;
  final int? daysTracked;
  final double? fuelDailyAvgCost;
  final double? fuelMinEfficiency;
  final double? fuelMaxEfficiency;

  const CostSummary({
    required this.totalFuelCost,
    required this.totalServiceCost,
    required this.totalExpenseCost,
    required this.totalCost,
    required this.fuelLogsCount,
    required this.serviceLogsCount,
    required this.expenseCount,
    this.totalKmRun,
    this.dailyAvgKm,
    this.daysTracked,
    this.fuelDailyAvgCost,
    this.fuelMinEfficiency,
    this.fuelMaxEfficiency,
  });

  factory CostSummary.fromJson(Map<String, dynamic> json) {
    return CostSummary(
      totalFuelCost: (json['total_fuel_cost'] as num?)?.toDouble() ?? 0.0,
      totalServiceCost:
          (json['total_service_cost'] as num?)?.toDouble() ?? 0.0,
      totalExpenseCost:
          (json['total_expense_cost'] as num?)?.toDouble() ?? 0.0,
      totalCost: (json['total_cost'] as num?)?.toDouble() ?? 0.0,
      fuelLogsCount: json['fuel_logs_count'] as int? ?? 0,
      serviceLogsCount: json['service_logs_count'] as int? ?? 0,
      expenseCount: json['expense_count'] as int? ?? 0,
      totalKmRun: (json['total_km_run'] as num?)?.toDouble(),
      dailyAvgKm: (json['daily_avg_km'] as num?)?.toDouble(),
      daysTracked: json['days_tracked'] as int?,
      fuelDailyAvgCost: (json['fuel_daily_avg_cost'] as num?)?.toDouble(),
      fuelMinEfficiency: (json['fuel_min_efficiency'] as num?)?.toDouble(),
      fuelMaxEfficiency: (json['fuel_max_efficiency'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total_fuel_cost': totalFuelCost,
      'total_service_cost': totalServiceCost,
      'total_expense_cost': totalExpenseCost,
      'total_cost': totalCost,
      'fuel_logs_count': fuelLogsCount,
      'service_logs_count': serviceLogsCount,
      'expense_count': expenseCount,
      if (totalKmRun != null) 'total_km_run': totalKmRun,
      if (dailyAvgKm != null) 'daily_avg_km': dailyAvgKm,
      if (daysTracked != null) 'days_tracked': daysTracked,
      if (fuelDailyAvgCost != null) 'fuel_daily_avg_cost': fuelDailyAvgCost,
      if (fuelMinEfficiency != null) 'fuel_min_efficiency': fuelMinEfficiency,
      if (fuelMaxEfficiency != null) 'fuel_max_efficiency': fuelMaxEfficiency,
    };
  }

  static CostSummary empty() {
    return const CostSummary(
      totalFuelCost: 0,
      totalServiceCost: 0,
      totalExpenseCost: 0,
      totalCost: 0,
      fuelLogsCount: 0,
      serviceLogsCount: 0,
      expenseCount: 0,
    );
  }
}

class MonthlyStats {
  final String month; // "YYYY-MM" format
  final double fuelCost;
  final double serviceCost;
  final double expenseCost;
  final double totalCost;

  const MonthlyStats({
    required this.month,
    required this.fuelCost,
    required this.serviceCost,
    required this.expenseCost,
    required this.totalCost,
  });

  factory MonthlyStats.fromJson(Map<String, dynamic> json) {
    return MonthlyStats(
      month: json['month'] as String? ?? '',
      fuelCost: (json['fuel_cost'] as num?)?.toDouble() ?? 0.0,
      serviceCost: (json['service_cost'] as num?)?.toDouble() ?? 0.0,
      expenseCost: (json['expense_cost'] as num?)?.toDouble() ?? 0.0,
      totalCost: (json['total_cost'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'month': month,
      'fuel_cost': fuelCost,
      'service_cost': serviceCost,
      'expense_cost': expenseCost,
      'total_cost': totalCost,
    };
  }
}

class ExpenseCategoryBreakdown {
  final String category;
  final double cost;

  const ExpenseCategoryBreakdown({
    required this.category,
    required this.cost,
  });

  factory ExpenseCategoryBreakdown.fromJson(Map<String, dynamic> json) {
    return ExpenseCategoryBreakdown(
      category: json['category'] as String? ?? '',
      cost: (json['cost'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'category': category,
      'cost': cost,
    };
  }
}

class BikeStats {
  final String bikeId;
  final CostSummary summary;
  final List<MonthlyStats> monthly;
  final double? avgFuelEfficiency;
  final double? costPerKm;
  final List<ExpenseCategoryBreakdown> expenseByCategory;

  const BikeStats({
    required this.bikeId,
    required this.summary,
    required this.monthly,
    this.avgFuelEfficiency,
    this.costPerKm,
    required this.expenseByCategory,
  });

  factory BikeStats.fromJson(Map<String, dynamic> json) {
    final monthlyJson = json['monthly'] as List<dynamic>? ?? [];
    final expenseByCategoryJson =
        json['expense_by_category'] as List<dynamic>? ?? [];

    return BikeStats(
      bikeId: json['bike_id']?.toString() ?? '',
      summary: CostSummary.fromJson(
          json['summary'] as Map<String, dynamic>? ?? {}),
      monthly: monthlyJson
          .map((e) => MonthlyStats.fromJson(e as Map<String, dynamic>))
          .toList(),
      avgFuelEfficiency: (json['avg_fuel_efficiency'] as num?)?.toDouble(),
      costPerKm: (json['cost_per_km'] as num?)?.toDouble(),
      expenseByCategory: expenseByCategoryJson
          .map((e) =>
              ExpenseCategoryBreakdown.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'bike_id': bikeId,
      'summary': summary.toJson(),
      'monthly': monthly.map((e) => e.toJson()).toList(),
      if (avgFuelEfficiency != null) 'avg_fuel_efficiency': avgFuelEfficiency,
      if (costPerKm != null) 'cost_per_km': costPerKm,
      'expense_by_category': expenseByCategory.map((e) => e.toJson()).toList(),
    };
  }

  static BikeStats empty(String bikeId) {
    return BikeStats(
      bikeId: bikeId,
      summary: CostSummary.empty(),
      monthly: const [],
      expenseByCategory: const [],
    );
  }
}
