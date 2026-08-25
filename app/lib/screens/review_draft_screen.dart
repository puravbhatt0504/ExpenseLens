import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../providers/providers.dart';
import '../models/transaction.dart';
import '../widgets/category_icon.dart';

/// Review Draft screen — pre-filled, editable form from parsed screenshot data.
class ReviewDraftScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> parsedData;

  const ReviewDraftScreen({super.key, required this.parsedData});

  @override
  ConsumerState<ReviewDraftScreen> createState() => _ReviewDraftScreenState();
}

class _ReviewDraftScreenState extends ConsumerState<ReviewDraftScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _amountController;
  late final TextEditingController _merchantController;
  late final TextEditingController _noteController;

  late DateTime _selectedDate;
  int? _selectedCategoryId;
  int? _suggestedCategoryId;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    
    // Pre-fill controllers with parsed data
    final amount = widget.parsedData['amount']?.toString() ?? '';
    _amountController = TextEditingController(text: amount);
    _merchantController =
        TextEditingController(text: widget.parsedData['merchant'] ?? '');
    _noteController =
        TextEditingController(text: widget.parsedData['note'] ?? '');

    // Parse date
    final dateStr = widget.parsedData['txnDate'];
    if (dateStr != null) {
      try {
        _selectedDate = DateTime.parse(dateStr);
      } catch (_) {
        _selectedDate = DateTime.now();
      }
    } else {
      _selectedDate = DateTime.now();
    }

    // Pre-select category ID
    final categoryId = widget.parsedData['categoryId'];
    if (categoryId != null && categoryId is int) {
      _selectedCategoryId = categoryId;
      _suggestedCategoryId = categoryId;
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _merchantController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_isSubmitting) return;

    setState(() => _isSubmitting = true);

    try {
      final api = ref.read(apiClientProvider);
      final dateStr =
          '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}';

      // Check for duplicates
      final txnsAsync = ref.read(transactionsProvider);
      if (txnsAsync is AsyncData<List<Transaction>>) {
        final amount = double.parse(_amountController.text);
        final merchant = _merchantController.text.trim();
        final isDuplicate = txnsAsync.value.any((t) =>
            t.amount == amount &&
            t.txnDate.startsWith(dateStr) &&
            ((t.merchant ?? '') == merchant));
            
        if (isDuplicate) {
          final confirm = await showDialog<bool>(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Duplicate Detected'),
              content: const Text('A transaction with this exact amount, date, and merchant already exists. Are you sure you want to save it?'),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Save Anyway')),
              ],
            ),
          );
          if (confirm != true) {
            setState(() => _isSubmitting = false);
            return;
          }
        }
      }

      await api.createTransaction(
        amount: double.parse(_amountController.text),
        txnDate: dateStr,
        merchant: _merchantController.text.isNotEmpty
            ? _merchantController.text
            : null,
        note: _noteController.text.isNotEmpty ? _noteController.text : null,
        categoryId: _selectedCategoryId,
        source: 'upi_screenshot',
        rawExtracted: widget.parsedData, // Save original parsed data for audit
        suggestedCategoryId: _suggestedCategoryId,
      );

      // Refresh the transaction list
      ref.invalidate(transactionsProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Transaction saved!'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.pop(context); // Go back to where we came from (dashboard/list)
      }
    } catch (e) {
      if (mounted) {
        String errMsg = e.toString();
        if (e is DioException && e.response?.data != null) {
          errMsg = 'Server Error: ${e.response?.statusCode} - ${e.response?.data}';
          debugPrint('=== DIO EXCEPTION START ===');
          debugPrint('Status: ${e.response?.statusCode}');
          debugPrint('Data: ${e.response?.data}');
          debugPrint('=== DIO EXCEPTION END ===');
        } else {
          debugPrint('=== EXCEPTION ===');
          debugPrint(e.toString());
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errMsg),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Theme.of(context).colorScheme.error,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Review Draft'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: theme.colorScheme.primary.withValues(alpha: 0.5),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(Icons.auto_awesome, color: theme.colorScheme.primary),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Text(
                        'Extracted by ExpenseLens. Please review and edit if needed before saving.',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Amount field
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(
                  labelText: 'Amount',
                  prefixText: '₹ ',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.currency_rupee),
                ),
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                ],
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter an amount';
                  }
                  final amount = double.tryParse(value);
                  if (amount == null || amount <= 0) {
                    return 'Please enter a valid amount';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Date picker
              InkWell(
                onTap: _pickDate,
                borderRadius: BorderRadius.circular(4),
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Date',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.calendar_today),
                  ),
                  child: Text(
                    '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                    style: theme.textTheme.bodyLarge,
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Merchant field
              TextFormField(
                controller: _merchantController,
                decoration: const InputDecoration(
                  labelText: 'Merchant / Payee',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.store),
                ),
                textCapitalization: TextCapitalization.words,
              ),
              const SizedBox(height: 16),

              // Note field
              TextFormField(
                controller: _noteController,
                decoration: const InputDecoration(
                  labelText: 'Note (optional)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.note),
                ),
                textCapitalization: TextCapitalization.sentences,
              ),
              const SizedBox(height: 16),

              // Category dropdown
              categoriesAsync.when(
                data: (categories) => DropdownButtonFormField<int>(
                  initialValue: _selectedCategoryId,
                  decoration: const InputDecoration(
                    labelText: 'Category',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.category),
                  ),
                  isExpanded: true,
                  items: categories.map((cat) {
                    final groupPrefix = cat.categoryGroup != null ? '${cat.categoryGroup} - ' : '';
                    return DropdownMenuItem<int>(
                      value: cat.id,
                      child: Row(
                        children: [
                          CategoryIconView(
                            iconKey: cat.icon,
                            size: 22,
                            legacyColor: Theme.of(context).colorScheme.onSurface,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              '$groupPrefix${cat.name}',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() => _selectedCategoryId = value);
                  },
                  validator: (value) {
                    if (value == null) return 'Please select a category';
                    return null;
                  },
                ),
                loading: () => const InputDecorator(
                  decoration: InputDecoration(
                    labelText: 'Category',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.category),
                  ),
                  child: LinearProgressIndicator(),
                ),
                error: (err, _) => InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Category',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.error),
                  ),
                  child: Text('Failed to load categories: $err',
                      style: TextStyle(color: theme.colorScheme.error)),
                ),
              ),
              const SizedBox(height: 32),

              // Submit button
              FilledButton.icon(
                onPressed: _isSubmitting ? null : _submit,
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.check),
                label: Text(_isSubmitting ? 'Saving...' : 'Confirm & Save'),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
