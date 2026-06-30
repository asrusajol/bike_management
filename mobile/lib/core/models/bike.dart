class Bike {
  final String id;
  final String name;
  final String? make;
  final String? model;
  final int? year;
  final int? cc;
  final String? colour;
  final double? tankCapacity;
  final String odometerUnit; // 'km' or 'miles'
  final String? purchaseDate;
  final double? purchasePrice;
  final String? plateNumber;
  final String? notes;
  final String? imageUrl;
  final String createdAt;
  final String? updatedAt;

  const Bike({
    required this.id,
    required this.name,
    this.make,
    this.model,
    this.year,
    this.cc,
    this.colour,
    this.tankCapacity,
    this.odometerUnit = 'km',
    this.purchaseDate,
    this.purchasePrice,
    this.plateNumber,
    this.notes,
    this.imageUrl,
    required this.createdAt,
    this.updatedAt,
  });

  String get displayName {
    if (make != null && model != null && year != null) {
      return '$year $make $model';
    } else if (make != null && model != null) {
      return '$make $model';
    }
    return name;
  }

  factory Bike.fromJson(Map<String, dynamic> json) {
    return Bike(
      id: json['id']?.toString() ?? '',
      name: json['name'] as String? ?? '',
      make: json['make'] as String?,
      model: json['model'] as String?,
      year: json['year'] as int?,
      cc: json['cc'] as int?,
      colour: json['colour'] as String?,
      tankCapacity: (json['tank_capacity'] as num?)?.toDouble(),
      odometerUnit: json['odometer_unit'] as String? ?? 'km',
      purchaseDate: json['purchase_date'] as String?,
      purchasePrice: (json['purchase_price'] as num?)?.toDouble(),
      plateNumber: json['plate_number'] as String?,
      notes: json['notes'] as String?,
      imageUrl: json['image_url'] as String?,
      createdAt: json['created_at'] as String? ?? '',
      updatedAt: json['updated_at'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      if (make != null) 'make': make,
      if (model != null) 'model': model,
      if (year != null) 'year': year,
      if (cc != null) 'cc': cc,
      if (colour != null) 'colour': colour,
      if (tankCapacity != null) 'tank_capacity': tankCapacity,
      'odometer_unit': odometerUnit,
      if (purchaseDate != null) 'purchase_date': purchaseDate,
      if (purchasePrice != null) 'purchase_price': purchasePrice,
      if (plateNumber != null) 'plate_number': plateNumber,
      if (notes != null) 'notes': notes,
      if (imageUrl != null) 'image_url': imageUrl,
      'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
    };
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'name': name,
      if (make != null) 'make': make,
      if (model != null) 'model': model,
      if (year != null) 'year': year,
      if (cc != null) 'cc': cc,
      if (colour != null) 'colour': colour,
      if (tankCapacity != null) 'tank_capacity': tankCapacity,
      'odometer_unit': odometerUnit,
      if (purchaseDate != null) 'purchase_date': purchaseDate,
      if (purchasePrice != null) 'purchase_price': purchasePrice,
      if (plateNumber != null) 'plate_number': plateNumber,
      if (notes != null) 'notes': notes,
    };
  }

  Bike copyWith({
    String? id,
    String? name,
    String? make,
    String? model,
    int? year,
    int? cc,
    String? colour,
    double? tankCapacity,
    String? odometerUnit,
    String? purchaseDate,
    double? purchasePrice,
    String? plateNumber,
    String? notes,
    String? imageUrl,
    String? createdAt,
    String? updatedAt,
  }) {
    return Bike(
      id: id ?? this.id,
      name: name ?? this.name,
      make: make ?? this.make,
      model: model ?? this.model,
      year: year ?? this.year,
      cc: cc ?? this.cc,
      colour: colour ?? this.colour,
      tankCapacity: tankCapacity ?? this.tankCapacity,
      odometerUnit: odometerUnit ?? this.odometerUnit,
      purchaseDate: purchaseDate ?? this.purchaseDate,
      purchasePrice: purchasePrice ?? this.purchasePrice,
      plateNumber: plateNumber ?? this.plateNumber,
      notes: notes ?? this.notes,
      imageUrl: imageUrl ?? this.imageUrl,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
