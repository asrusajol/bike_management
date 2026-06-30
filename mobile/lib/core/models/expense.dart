enum ExpenseCategory {
  insurance,
  tax,
  parking,
  accessories,
  repair,
  cleaning,
  fine,
  other,
}

const expenseCategoryLabel = {
  ExpenseCategory.insurance: 'Insurance',
  ExpenseCategory.tax: 'Tax',
  ExpenseCategory.parking: 'Parking',
  ExpenseCategory.accessories: 'Accessories',
  ExpenseCategory.repair: 'Repair',
  ExpenseCategory.cleaning: 'Cleaning',
  ExpenseCategory.fine: 'Fine',
  ExpenseCategory.other: 'Other',
};

ExpenseCategory expenseCategoryFromString(String value) {
  switch (value) {
    case 'insurance':
      return ExpenseCategory.insurance;
    case 'tax':
      return ExpenseCategory.tax;
    case 'parking':
      return ExpenseCategory.parking;
    case 'accessories':
      return ExpenseCategory.accessories;
    case 'repair':
      return ExpenseCategory.repair;
    case 'cleaning':
      return ExpenseCategory.cleaning;
    case 'fine':
      return ExpenseCategory.fine;
    default:
      return ExpenseCategory.other;
  }
}

String expenseCategoryToString(ExpenseCategory category) {
  switch (category) {
    case ExpenseCategory.insurance:
      return 'insurance';
    case ExpenseCategory.tax:
      return 'tax';
    case ExpenseCategory.parking:
      return 'parking';
    case ExpenseCategory.accessories:
      return 'accessories';
    case ExpenseCategory.repair:
      return 'repair';
    case ExpenseCategory.cleaning:
      return 'cleaning';
    case ExpenseCategory.fine:
      return 'fine';
    case ExpenseCategory.other:
      return 'other';
  }
}

class Expense {
  final String id;
  final String bikeId;
  final String loggedAt;
  final ExpenseCategory category;
  final double cost;
  final String? description;
  final String? notes;
  final String createdAt;

  const Expense({
    required this.id,
    required this.bikeId,
    required this.loggedAt,
    required this.category,
    required this.cost,
    this.description,
    this.notes,
    required this.createdAt,
  });

  factory Expense.fromJson(Map<String, dynamic> json) {
    return Expense(
      id: json['id']?.toString() ?? '',
      bikeId: json['bike_id']?.toString() ?? '',
      loggedAt: json['logged_at'] as String? ?? '',
      category: expenseCategoryFromString(json['category'] as String? ?? ''),
      cost: (json['cost'] as num?)?.toDouble() ?? 0.0,
      description: json['description'] as String?,
      notes: json['notes'] as String?,
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bike_id': bikeId,
      'logged_at': loggedAt,
      'category': expenseCategoryToString(category),
      'cost': cost,
      if (description != null) 'description': description,
      if (notes != null) 'notes': notes,
      'created_at': createdAt,
    };
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'bike_id': bikeId,
      'logged_at': loggedAt,
      'category': expenseCategoryToString(category),
      'cost': cost,
      if (description != null) 'description': description,
      if (notes != null) 'notes': notes,
    };
  }
}
