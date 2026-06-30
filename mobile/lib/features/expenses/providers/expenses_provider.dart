import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/expense.dart';
import '../../../core/services/expense_service.dart';

final expensesProvider =
    FutureProvider.autoDispose.family<List<Expense>, String>((ref, bikeId) async {
  final service = ref.watch(expenseServiceProvider);
  return service.getExpenses(bikeId);
});

class ExpenseNotifier extends StateNotifier<AsyncValue<void>> {
  final ExpenseService _service;
  final Ref _ref;
  final String bikeId;

  ExpenseNotifier(this._service, this._ref, this.bikeId)
      : super(const AsyncValue.data(null));

  Future<bool> createExpense(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      await _service.createExpense(bikeId, data);
      _ref.invalidate(expensesProvider(bikeId));
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> deleteExpense(String id) async {
    state = const AsyncValue.loading();
    try {
      await _service.deleteExpense(id);
      _ref.invalidate(expensesProvider(bikeId));
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }
}

final expenseNotifierProvider = StateNotifierProvider.autoDispose
    .family<ExpenseNotifier, AsyncValue<void>, String>((ref, bikeId) {
  final service = ref.watch(expenseServiceProvider);
  return ExpenseNotifier(service, ref, bikeId);
});
