import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/bike_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/error_message.dart';
import '../providers/bikes_provider.dart';

class BikeFormScreen extends ConsumerStatefulWidget {
  final String? bikeId;

  const BikeFormScreen({super.key, this.bikeId});

  @override
  ConsumerState<BikeFormScreen> createState() => _BikeFormScreenState();
}

class _BikeFormScreenState extends ConsumerState<BikeFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _makeController = TextEditingController();
  final _modelController = TextEditingController();
  final _yearController = TextEditingController();
  final _ccController = TextEditingController();
  final _colourController = TextEditingController();
  final _tankCapacityController = TextEditingController();
  final _plateController = TextEditingController();
  final _purchasePriceController = TextEditingController();
  final _notesController = TextEditingController();
  String _odometerUnit = 'km';
  String? _purchaseDate;
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _makeController.dispose();
    _modelController.dispose();
    _yearController.dispose();
    _ccController.dispose();
    _colourController.dispose();
    _tankCapacityController.dispose();
    _plateController.dispose();
    _purchasePriceController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickPurchaseDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(1990),
      lastDate: DateTime.now(),
    );
    if (date != null) {
      setState(() {
        _purchaseDate = date.toIso8601String().split('T').first;
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final data = {
        'name': _nameController.text.trim(),
        if (_makeController.text.isNotEmpty) 'make': _makeController.text.trim(),
        if (_modelController.text.isNotEmpty) 'model': _modelController.text.trim(),
        if (_yearController.text.isNotEmpty)
          'year': int.tryParse(_yearController.text),
        if (_ccController.text.isNotEmpty)
          'cc': int.tryParse(_ccController.text),
        if (_colourController.text.isNotEmpty)
          'colour': _colourController.text.trim(),
        if (_tankCapacityController.text.isNotEmpty)
          'tank_capacity': double.tryParse(_tankCapacityController.text),
        'odometer_unit': _odometerUnit,
        if (_plateController.text.isNotEmpty)
          'plate_number': _plateController.text.trim(),
        if (_purchasePriceController.text.isNotEmpty)
          'purchase_price': double.tryParse(_purchasePriceController.text),
        if (_purchaseDate != null) 'purchase_date': _purchaseDate,
        if (_notesController.text.isNotEmpty) 'notes': _notesController.text.trim(),
      };
      final service = ref.read(bikeServiceProvider);
      if (widget.bikeId == null) {
        await service.createBike(data);
      } else {
        await service.updateBike(widget.bikeId!, data);
      }
      ref.invalidate(bikesProvider);
      if (mounted) context.pop();
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.bikeId != null;
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Edit Bike' : 'Add Bike'),
      ),
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
              AppTextField(
                controller: _nameController,
                label: 'Bike Name *',
                hintText: 'e.g. My Honda',
                validator: (v) =>
                    v == null || v.isEmpty ? 'Name is required' : null,
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      controller: _makeController,
                      label: 'Make',
                      hintText: 'Honda',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      controller: _modelController,
                      label: 'Model',
                      hintText: 'CB300R',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      controller: _yearController,
                      label: 'Year',
                      hintText: '2022',
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      controller: _ccController,
                      label: 'Engine (cc)',
                      hintText: '300',
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      controller: _colourController,
                      label: 'Colour',
                      hintText: 'Matte Black',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      controller: _tankCapacityController,
                      label: 'Tank (L)',
                      hintText: '12.0',
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              AppTextField(
                controller: _plateController,
                label: 'Plate Number',
                hintText: 'MH 01 AB 1234',
              ),
              const SizedBox(height: 14),
              // Odometer unit
              DropdownButtonFormField<String>(
                value: _odometerUnit,
                decoration: const InputDecoration(
                  labelText: 'Odometer Unit',
                ),
                items: const [
                  DropdownMenuItem(value: 'km', child: Text('Kilometers (km)')),
                  DropdownMenuItem(value: 'miles', child: Text('Miles')),
                ],
                onChanged: (v) => setState(() => _odometerUnit = v!),
              ),
              const SizedBox(height: 14),
              // Purchase date
              GestureDetector(
                onTap: _pickPurchaseDate,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Purchase Date',
                    suffixIcon: Icon(Icons.calendar_today_outlined, size: 18),
                  ),
                  child: Text(
                    _purchaseDate ?? 'Select date',
                    style: TextStyle(
                      color: _purchaseDate != null
                          ? AppColors.textPrimary
                          : AppColors.textSecondary,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              AppTextField(
                controller: _purchasePriceController,
                label: 'Purchase Price',
                hintText: '150000',
                keyboardType: TextInputType.number,
                suffix: const Padding(
                  padding: EdgeInsets.only(right: 12),
                  child: Text('₹',
                      style: TextStyle(
                          color: AppColors.textSecondary, fontSize: 16)),
                ),
              ),
              const SizedBox(height: 14),
              AppTextField(
                controller: _notesController,
                label: 'Notes',
                hintText: 'Any additional notes...',
                maxLines: 3,
              ),
              const SizedBox(height: 24),
              AppButton(
                label: isEdit ? 'Update Bike' : 'Add Bike',
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
