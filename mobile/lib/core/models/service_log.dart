class ServiceItem {
  final String name;
  final double cost;

  const ServiceItem({
    required this.name,
    required this.cost,
  });

  factory ServiceItem.fromJson(Map<String, dynamic> json) {
    return ServiceItem(
      name: json['name'] as String? ?? '',
      cost: (json['cost'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'cost': cost,
    };
  }

  ServiceItem copyWith({String? name, double? cost}) {
    return ServiceItem(
      name: name ?? this.name,
      cost: cost ?? this.cost,
    );
  }
}

class ServiceLog {
  final String id;
  final String bikeId;
  final String loggedAt;
  final double odometerReading;
  final List<ServiceItem> serviceItems;
  final double cost;
  final String? workshopName;
  final double? nextServiceKm;
  final String? nextServiceDate;
  final String? notes;
  final String createdAt;

  const ServiceLog({
    required this.id,
    required this.bikeId,
    required this.loggedAt,
    required this.odometerReading,
    required this.serviceItems,
    required this.cost,
    this.workshopName,
    this.nextServiceKm,
    this.nextServiceDate,
    this.notes,
    required this.createdAt,
  });

  factory ServiceLog.fromJson(Map<String, dynamic> json) {
    final itemsJson = json['service_items'] as List<dynamic>? ?? [];
    return ServiceLog(
      id: json['id']?.toString() ?? '',
      bikeId: json['bike_id']?.toString() ?? '',
      loggedAt: json['logged_at'] as String? ?? '',
      odometerReading: (json['odometer_reading'] as num?)?.toDouble() ?? 0.0,
      serviceItems: itemsJson
          .map((e) => ServiceItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      cost: (json['cost'] as num?)?.toDouble() ?? 0.0,
      workshopName: json['workshop_name'] as String?,
      nextServiceKm: (json['next_service_km'] as num?)?.toDouble(),
      nextServiceDate: json['next_service_date'] as String?,
      notes: json['notes'] as String?,
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bike_id': bikeId,
      'logged_at': loggedAt,
      'odometer_reading': odometerReading,
      'service_items': serviceItems.map((e) => e.toJson()).toList(),
      'cost': cost,
      if (workshopName != null) 'workshop_name': workshopName,
      if (nextServiceKm != null) 'next_service_km': nextServiceKm,
      if (nextServiceDate != null) 'next_service_date': nextServiceDate,
      if (notes != null) 'notes': notes,
      'created_at': createdAt,
    };
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'bike_id': bikeId,
      'logged_at': loggedAt,
      'odometer_reading': odometerReading,
      'service_items': serviceItems.map((e) => e.toJson()).toList(),
      'cost': cost,
      if (workshopName != null) 'workshop_name': workshopName,
      if (nextServiceKm != null) 'next_service_km': nextServiceKm,
      if (nextServiceDate != null) 'next_service_date': nextServiceDate,
      if (notes != null) 'notes': notes,
    };
  }
}
