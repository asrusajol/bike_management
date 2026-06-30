import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/fuel_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/error_message.dart';

class FuelFormScreen extends ConsumerStatefulWidget {
  final String bikeId;

  const FuelFormScreen({super.key, required this.bikeId});

  @override
  ConsumerState<FuelFormScreen> createState() => _FuelFormScreenState();
}

class _FuelFormScreenState extends ConsumerState<FuelFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _odometerController = TextEditingController();
  final _priceController = TextEditingController();
  final _quantityController = TextEditingController();
  final _totalCostController = TextEditingController();
  final _stationController = TextEditingController();
  final _notesController = TextEditingController();

  DateTime _loggedAt = DateTime.now();
  bool _isFullTank = true;
  bool _isLoading = false;
  String? _error;
  List<String> _recentStations = [];
  bool _updatingTotal = false;
  bool _updatingQty = false;

  @override
  void initState() {
    super.initState();
    _loadRecentStations();
    _quantityController.addListener(_onQuantityChanged);
    _totalCostController.addListener(_onTotalChanged);
    _priceController.addListener(_onPriceChanged);
  }

  @override
  void dispose() {
    _odometerController.dispose();
    _priceController.dispose();
    _quantityController.dispose();
    _totalCostController.dispose();
    _stationController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _onQuantityChanged() {
    if (_updatingQty) return;
    _updatingTotal = true;
    final qty = double.tryParse(_quantityController.text);
    final price = double.tryParse(_priceController.text);
    if (qty != null && price != null) {
      _totalCostController.text = (qty * price).toStringAsFixed(2);
    }
    _updatingTotal = false;
  }

  void _onTotalChanged() {
    if (_updatingTotal) return;
    _updatingQty = true;
    final total = double.tryParse(_totalCostController.text);
    final price = double.tryParse(_priceController.text);
    if (total != null && price != null && price > 0) {
      _quantityController.text = (total / price).toStringAsFixed(2);
    }
    _updatingQty = false;
  }

  void _onPriceChanged() {
    // When price changes, update total based on current quantity
    _onQuantityChanged();
  }

  Future<void> _loadRecentStations() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _recentStations = prefs.getStringList('recent_stations') ?? [];
    });
  }

  Future<void> _saveStation(String station) async {
    if (station.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    final stations = prefs.getStringList('recent_stations') ?? [];
    if (!stations.contains(station)) {
      stations.insert(0, station);
      if (stations.length > 5) stations.removeLast();
      await prefs.setStringList('recent_stations', stations);
    }
  }

  Future<void> _pickDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _loggedAt,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (date == null) return;
    if (!mounted) return;
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

    final station = _stationController.text.trim();
    await _saveStation(station);

    final data = {
      'bike_id': widget.bikeId,
      'logged_at': _loggedAt.toIso8601String(),
      'odometer_reading':
          double.tryParse(_odometerController.text) ?? 0.0,
      'fuel_price_per_unit':
          double.tryParse(_priceController.text) ?? 0.0,
      'fuel_quantity': double.tryParse(_quantityController.text) ?? 0.0,
      'total_cost': double.tryParse(_totalCostController.text) ?? 0.0,
      'is_full_tank': _isFullTank,
      if (station.isNotEmpty) 'station_name': station,
      if (_notesController.text.isNotEmpty) 'notes': _notesController.text.trim(),
    };

    final success = await ref
        .read(createFuelLogProvider(widget.bikeId).notifier)
        .createFuelLog(data);

    if (success && mounted) {
      context.pop();
    } else {
      setState(() {
        _isLoading = false;
        _error = 'Failed to save fuel log. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Fuel Entry')),
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

              // Date/time picker
              GestureDetector(
                onTap: _pickDateTime,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Date & Time',
                    suffixIcon:
                        Icon(Icons.calendar_today_outlined, size: 18),
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
                hintText: '12500',
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                validator: (v) => v == null || v.isEmpty
                    ? 'Odometer reading is required'
                    : null,
              ),
              const SizedBox(height: 14),

              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      controller: _priceController,
                      label: 'Price/Litre (₹) *',
                      hintText: '103.50',
                      keyboardType: const TextInputType.numberWithOptions(
                          decimal: true),
                      validator: (v) =>
                          v == null || v.isEmpty ? 'Price is required' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      controller: _quantityController,
                      label: 'Quantity (L) *',
                      hintText: '8.5',
                      keyboardType: const TextInputType.numberWithOptions(
                          decimal: true),
                      validator: (v) => v == null || v.isEmpty
                          ? 'Quantity is required'
                          : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              AppTextField(
                controller: _totalCostController,
                label: 'Total Cost (₹) *',
                hintText: 'Auto-calculated',
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                validator: (v) =>
                    v == null || v.isEmpty ? 'Total cost is required' : null,
              ),
              const SizedBox(height: 14),

              // Station name with recent suggestions
              AppTextField(
                controller: _stationController,
                label: 'Station Name',
                hintText: 'e.g. Indian Oil, HP',
              ),
              if (_recentStations.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: _recentStations
                      .map((s) => ActionChip(
                            label: Text(s),
                            onPressed: () {
                              _stationController.text = s;
                            },
                          ))
                      .toList(),
                ),
              ],
              const SizedBox(height: 14),

              // Full tank toggle
              SwitchListTile(
                value: _isFullTank,
                onChanged: (v) => setState(() => _isFullTank = v),
                title: const Text('Full Tank Fill-up'),
                subtitle: const Text(
                    'Enable for accurate efficiency calculation'),
                activeColor: AppColors.primary,
                contentPadding: EdgeInsets.zero,
              ),
              const SizedBox(height: 14),

              AppTextField(
                controller: _notesController,
                label: 'Notes',
                hintText: 'Optional notes...',
                maxLines: 2,
              ),
              const SizedBox(height: 24),

              AppButton(
                label: 'Save Fuel Entry',
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
