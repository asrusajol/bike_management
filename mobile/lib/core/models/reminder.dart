class Reminder {
  final String id;
  final String bikeId;
  final String type;
  final String title;
  final double? triggerKm;
  final String? triggerDate;
  final bool isActive;
  final String? notes;
  final String createdAt;

  const Reminder({
    required this.id,
    required this.bikeId,
    required this.type,
    required this.title,
    this.triggerKm,
    this.triggerDate,
    this.isActive = true,
    this.notes,
    required this.createdAt,
  });

  factory Reminder.fromJson(Map<String, dynamic> json) {
    return Reminder(
      id: json['id']?.toString() ?? '',
      bikeId: json['bike_id']?.toString() ?? '',
      type: json['type'] as String? ?? '',
      title: json['title'] as String? ?? '',
      triggerKm: (json['trigger_km'] as num?)?.toDouble(),
      triggerDate: json['trigger_date'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      notes: json['notes'] as String?,
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bike_id': bikeId,
      'type': type,
      'title': title,
      if (triggerKm != null) 'trigger_km': triggerKm,
      if (triggerDate != null) 'trigger_date': triggerDate,
      'is_active': isActive,
      if (notes != null) 'notes': notes,
      'created_at': createdAt,
    };
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'bike_id': bikeId,
      'type': type,
      'title': title,
      if (triggerKm != null) 'trigger_km': triggerKm,
      if (triggerDate != null) 'trigger_date': triggerDate,
      'is_active': isActive,
      if (notes != null) 'notes': notes,
    };
  }

  Reminder copyWith({
    String? id,
    String? bikeId,
    String? type,
    String? title,
    double? triggerKm,
    String? triggerDate,
    bool? isActive,
    String? notes,
    String? createdAt,
  }) {
    return Reminder(
      id: id ?? this.id,
      bikeId: bikeId ?? this.bikeId,
      type: type ?? this.type,
      title: title ?? this.title,
      triggerKm: triggerKm ?? this.triggerKm,
      triggerDate: triggerDate ?? this.triggerDate,
      isActive: isActive ?? this.isActive,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
