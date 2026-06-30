class FuelLog {
  final String id;
  final String bikeId;
  final String loggedAt;
  final double odometerReading;
  final double fuelQuantity;
  final double fuelPricePerUnit;
  final double totalCost;
  final bool isFullTank;
  final String? stationName;
  final String? notes;
  final double? kmSinceLast;
  final double? fuelEfficiency;
  final String createdAt;

  const FuelLog({
    required this.id,
    required this.bikeId,
    required this.loggedAt,
    required this.odometerReading,
    required this.fuelQuantity,
    required this.fuelPricePerUnit,
    required this.totalCost,
    this.isFullTank = true,
    this.stationName,
    this.notes,
    this.kmSinceLast,
    this.fuelEfficiency,
    required this.createdAt,
  });

  factory FuelLog.fromJson(Map<String, dynamic> json) {
    return FuelLog(
      id: json['id']?.toString() ?? '',
      bikeId: json['bike_id']?.toString() ?? '',
      loggedAt: json['logged_at'] as String? ?? '',
      odometerReading: (json['odometer_reading'] as num?)?.toDouble() ?? 0.0,
      fuelQuantity: (json['fuel_quantity'] as num?)?.toDouble() ?? 0.0,
      fuelPricePerUnit:
          (json['fuel_price_per_unit'] as num?)?.toDouble() ?? 0.0,
      totalCost: (json['total_cost'] as num?)?.toDouble() ?? 0.0,
      isFullTank: json['is_full_tank'] as bool? ?? true,
      stationName: json['station_name'] as String?,
      notes: json['notes'] as String?,
      kmSinceLast: (json['km_since_last'] as num?)?.toDouble(),
      fuelEfficiency: (json['fuel_efficiency'] as num?)?.toDouble(),
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bike_id': bikeId,
      'logged_at': loggedAt,
      'odometer_reading': odometerReading,
      'fuel_quantity': fuelQuantity,
      'fuel_price_per_unit': fuelPricePerUnit,
      'total_cost': totalCost,
      'is_full_tank': isFullTank,
      if (stationName != null) 'station_name': stationName,
      if (notes != null) 'notes': notes,
      if (kmSinceLast != null) 'km_since_last': kmSinceLast,
      if (fuelEfficiency != null) 'fuel_efficiency': fuelEfficiency,
      'created_at': createdAt,
    };
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'bike_id': bikeId,
      'logged_at': loggedAt,
      'odometer_reading': odometerReading,
      'fuel_quantity': fuelQuantity,
      'fuel_price_per_unit': fuelPricePerUnit,
      'total_cost': totalCost,
      'is_full_tank': isFullTank,
      if (stationName != null) 'station_name': stationName,
      if (notes != null) 'notes': notes,
    };
  }
}
