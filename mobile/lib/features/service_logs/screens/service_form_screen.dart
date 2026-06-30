import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/service_provider.dart';
import '../../../core/models/service_log.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/error_message.dart';

const _predefinedServices = [
  'Engine Oil',
  'Brake Pad',
  'Air Filter',
  'Oil Filter',
  'Chain',
  'Tire',
  'Battery',
  'Spark Plug',
  'Coolant',
  'General Service',
  'Other',
];

class ServiceFormScreen extends ConsumerStatefulWidget {
  final String bikeId;

  const ServiceFormScreen({super.key, required this.bikeId});

  @override
  ConsumerState<ServiceFormScreen> createState() => _ServiceFormScreenState();
}

class _ServiceFormScreenState extends ConsumerState<ServiceFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _odometerController = TextEditingController();
  final _workshopController = TextEditingController();
  final _nextKmController = TextEditingController();
  final _notesController = TextEditingController();

  DateTime _loggedAt = DateTime.now();
  String? _nextServiceDate;
  List<_ServiceItemRow> _items = [];
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _odometerController.dispose();
    _workshopController.dispose();
    _nextKmController.dispose();
    _notesController.dispose();
    for (final item in _items) {
      item.nameController.dispose();
      item.costController.dispose();
    }
    super.dispose();
  }

  void _addServiceItem(String name) {
    setState(() {
      _items.add(_ServiceItemRow(name: name));
    });
  }

  void _removeItem(int index) {
    setState(() {
      _items[index].nameController.dispose();
      _items[index].costController.dispose();
      _items.removeAt(index);
    });
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

  Future<void> _pickNextServiceDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 90)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
    );
    if (date != null) {
      setState(() {
        _nextServiceDate = date.toIso8601String().split('T').first;
      });
    }
  }

  double get _totalCost => _items.fold(
      0.0, (sum, item) => sum + (double.tryParse(item.costController.text) ?? 0.0));

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_items.isEmpty) {
      setState(() => _error = 'Please add at least one service item');
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final serviceItems = _items
        .map((item) => ServiceItem(
              name: item.nameController.text.trim(),
              cost: double.tryParse(item.costController.text) ?? 0.0,
            ))
        .toList();

    final data = {
      'bike_id': widget.bikeId,
      'logged_at': _loggedAt.toIso8601String(),
      'odometer_reading':
          double.tryParse(_odometerController.text) ?? 0.0,
      'service_items': serviceItems.map((e) => e.toJson()).toList(),
      'cost': _totalCost,
      if (_workshopController.text.isNotEmpty)
        'workshop_name': _workshopController.text.trim(),
      if (_nextKmController.text.isNotEmpty)
        'next_service_km': double.tryParse(_nextKmController.text),
      if (_nextServiceDate != null) 'next_service_date': _nextServiceDate,
      if (_notesController.text.isNotEmpty)
        'notes': _notesController.text.trim(),
    };

    final success = await ref
        .read(serviceLogNotifierProvider(widget.bikeId).notifier)
        .createServiceLog(data);

    if (success && mounted) {
      context.pop();
    } else {
      setState(() {
        _isLoading = false;
        _error = 'Failed to save service log. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Log Service')),
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

              AppTextField(
                controller: _odometerController,
                label: 'Odometer Reading (km) *',
                hintText: '15000',
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                validator: (v) => v == null || v.isEmpty
                    ? 'Odometer reading is required'
                    : null,
              ),
              const SizedBox(height: 14),

              AppTextField(
                controller: _workshopController,
                label: 'Workshop Name',
                hintText: 'e.g. Honda Service Center',
              ),
              const SizedBox(height: 20),

              // Quick add chips
              Text('Quick Add Service Items',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _predefinedServices
                    .map((name) => ActionChip(
                          label: Text(name, style: const TextStyle(fontSize: 12)),
                          avatar: const Icon(Icons.add, size: 14),
                          onPressed: () => _addServiceItem(name),
                          backgroundColor: AppColors.serviceColor.withValues(alpha: 0.08),
                          side: const BorderSide(color: AppColors.serviceColor, width: 0.5),
                          labelStyle: const TextStyle(color: AppColors.serviceColor),
                        ))
                    .toList(),
              ),
              const SizedBox(height: 16),

              // Service items list
              if (_items.isNotEmpty) ...[
                Text('Service Items',
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                ..._items.asMap().entries.map((entry) {
                  final index = entry.key;
                  final item = entry.value;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 3,
                          child: TextFormField(
                            controller: item.nameController,
                            decoration: InputDecoration(
                              labelText: 'Item ${index + 1}',
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10)),
                            ),
                            validator: (v) => v == null || v.isEmpty
                                ? 'Required'
                                : null,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          flex: 2,
                          child: TextFormField(
                            controller: item.costController,
                            decoration: InputDecoration(
                              labelText: 'Cost (₹)',
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10)),
                            ),
                            keyboardType:
                                const TextInputType.numberWithOptions(
                                    decimal: true),
                            onChanged: (_) => setState(() {}),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.remove_circle_outline,
                              color: AppColors.error),
                          onPressed: () => _removeItem(index),
                        ),
                      ],
                    ),
                  );
                }),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.serviceColor.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total Cost',
                          style: TextStyle(fontWeight: FontWeight.w600)),
                      Text(
                        '₹${_totalCost.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: AppColors.serviceColor,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Next service
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      controller: _nextKmController,
                      label: 'Next Service (km)',
                      hintText: '18000',
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: GestureDetector(
                      onTap: _pickNextServiceDate,
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Next Service Date',
                          suffixIcon: Icon(Icons.calendar_today_outlined,
                              size: 16),
                        ),
                        child: Text(
                          _nextServiceDate ?? 'Select',
                          style: TextStyle(
                            color: _nextServiceDate != null
                                ? AppColors.textPrimary
                                : AppColors.textSecondary,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
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
                label: 'Save Service Log',
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

class _ServiceItemRow {
  final TextEditingController nameController;
  final TextEditingController costController;

  _ServiceItemRow({String name = ''})
      : nameController = TextEditingController(text: name),
        costController = TextEditingController();
}
