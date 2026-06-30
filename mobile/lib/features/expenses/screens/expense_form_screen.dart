import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/expenses_provider.dart';
import '../../../core/models/expense.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/error_message.dart';

class ExpenseFormScreen extends ConsumerStatefulWidget {
  final String bikeId;

  const ExpenseFormScreen({super.key, required this.bikeId});

  @override
  ConsumerState<ExpenseFormScreen> createState() => _ExpenseFormScreenState();
}

class _ExpenseFormScreenState extends ConsumerState<ExpenseFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _costController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _notesController = TextEditingController();

  DateTime _loggedAt = DateTime.now();
  ExpenseCategory _category = ExpenseCategory.other;
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _costController.dispose();
    _descriptionController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _loggedAt,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_loggedAt),
    );
    if (time == null) return;
    setState(() {
      _loggedAt = DateTime(
          date.year, date.month, date.day, time.hour, time.minute);
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final data = {
      'bike_id': widget.bikeId,
      'logged_at': _loggedAt.toIso8601String(),
      'category': expenseCategoryToString(_category),
      'cost': double.tryParse(_costController.text) ?? 0.0,
      if (_descriptionController.text.isNotEmpty)
        'description': _descriptionController.text.trim(),
      if (_notesController.text.isNotEmpty)
        'notes': _notesController.text.trim(),
    };

    final success = await ref
        .read(expenseNotifierProvider(widget.bikeId).notifier)
        .createExpense(data);

    if (success && mounted) {
      context.pop();
    } else {
      setState(() {
        _isLoading = false;
        _error = 'Failed to save expense. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Expense')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_error != null) ...[
                ErrorMessage(message: _error!),
                const SizedBox(height: 16),
              ],

              GestureDetector(
                onTap: _pickDateTime,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Date & Time',
                    suffixIcon: Icon(Icons.calendar_today_outlined, size: 18),
                  ),
                  child: Text(
                    '${_loggedAt.year}-${_loggedAt.month.toString().padLeft(2, '0')}-${_loggedAt.day.toString().padLeft(2, '0')}  ${_loggedAt.hour.toString().padLeft(2, '0')}:${_loggedAt.minute.toString().padLeft(2, '0')}',
                    style: const TextStyle(color: AppColors.textPrimary),
                  ),
                ),
              ),
              const SizedBox(height: 14),

              DropdownButtonFormField<ExpenseCategory>(
                value: _category,
                decoration: const InputDecoration(labelText: 'Category *'),
                items: ExpenseCategory.values.map((cat) {
                  return DropdownMenuItem(
                    value: cat,
                    child: Text(expenseCategoryLabel[cat] ?? cat.name),
                  );
                }).toList(),
                onChanged: (v) => setState(() => _category = v!),
                validator: (v) => v == null ? 'Category is required' : null,
              ),
              const SizedBox(height: 14),

              AppTextField(
                controller: _costController,
                label: 'Amount (₹) *',
                hintText: '2500',
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                validator: (v) =>
                    v == null || v.isEmpty ? 'Amount is required' : null,
                suffix: const Padding(
                  padding: EdgeInsets.only(right: 12),
                  child: Text('₹',
                      style: TextStyle(
                          color: AppColors.textSecondary, fontSize: 16)),
                ),
              ),
              const SizedBox(height: 14),

              AppTextField(
                controller: _descriptionController,
                label: 'Description',
                hintText: 'What was this expense for?',
              ),
              const SizedBox(height: 14),

              AppTextField(
                controller: _notesController,
                label: 'Notes',
                hintText: 'Additional notes...',
                maxLines: 2,
              ),
              const SizedBox(height: 24),

              AppButton(
                label: 'Save Expense',
                isLoading: _isLoading,
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
