import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_constants.dart';
import '../models/expense.dart';

class ExpenseService {
  final Dio _dio;

  ExpenseService(this._dio);

  Future<List<Expense>> getExpenses(String bikeId) async {
    final response = await _dio.get(
      ApiConstants.expenses,
      queryParameters: {'bike_id': bikeId},
    );
    final data = response.data as List<dynamic>;
    return data
        .map((e) => Expense.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Expense> createExpense(
      String bikeId, Map<String, dynamic> data) async {
    final response = await _dio.post(
      ApiConstants.expenses,
      queryParameters: {'bike_id': bikeId},
      data: data,
    );
    return Expense.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteExpense(String id) async {
    await _dio.delete(ApiConstants.expense(id));
  }
}

final expenseServiceProvider = Provider<ExpenseService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return ExpenseService(dio);
});
