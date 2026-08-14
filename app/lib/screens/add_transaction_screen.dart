import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../providers/providers.dart';
import '../models/transaction.dart';
import '../utils/circum_icons.dart';

/// Add Transaction screen — manual expense entry form.
class AddTransactionScreen extends ConsumerStatefulWidget {
  const AddTransactionScreen({super.key});

  @override
  ConsumerState<AddTransactionScreen> createState() =>
      _AddTransactionScreenState();
}

class _AddTransactionScreenState extends ConsumerState<AddTransactionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _merchantController = TextEditingController();
  final _noteController = TextEditingController();

  DateTime _selectedDate = DateTime.now();
  int? _selectedCategoryId;
  String _selectedPaymentMethod = 'UPI';
  bool _isSubmitting = false;

  Transaction? _existingTransaction;
  bool _isInit = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_isInit) {
      final args = ModalRoute.of(context)?.settings.arguments as Transaction?;
      if (args != null) {
        _existingTransaction = args;
        _amountController.text = args.amount.toString();
        _merchantController.text = args.merchant ?? '';
        _noteController.text = args.note ?? '';
        _selectedCategoryId = args.categoryId;
        _selectedPaymentMethod = args.paymentMethod ?? 'UPI';
        
        try {
          _selectedDate = DateTime.parse(args.txnDate);
        } catch (_) {}
      }
      _isInit = true;
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
    if (_selectedCategoryId == null) return;
    if (_isSubmitting) return;

    setState(() => _isSubmitting = true);

    try {
      final api = ref.read(apiClientProvider);
      final dateStr =
          '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}';

      if (_existingTransaction != null) {
        await api.updateTransaction(
          _existingTransaction!.id!,
          {
            'amount': double.parse(_amountController.text),
            'txn_date': dateStr,
            if (_merchantController.text.isNotEmpty) 'merchant': _merchantController.text,
            if (_noteController.text.isNotEmpty) 'note': _noteController.text,
            if (_selectedCategoryId != null) 'category_id': _selectedCategoryId,
            'payment_method': _selectedPaymentMethod,
          }
        );
      } else {
        await api.createTransaction(
          amount: double.parse(_amountController.text),
          txnDate: dateStr,
          merchant: _merchantController.text.isNotEmpty
              ? _merchantController.text
              : null,
          note: _noteController.text.isNotEmpty ? _noteController.text : null,
          categoryId: _selectedCategoryId,
          paymentMethod: _selectedPaymentMethod,
          source: 'manual',
        );
      }

      // Refresh the transaction list and summary
      ref.invalidate(transactionsProvider);
      ref.invalidate(summaryProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_existingTransaction != null ? 'Transaction updated!' : 'Transaction added!'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save transaction: $e'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Theme.of(context).colorScheme.error,
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
        title: Text(_existingTransaction != null ? 'Edit Transaction' : 'Add Transaction'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
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
                autofocus: true,
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
                  hintText: 'e.g. Swiggy, Uber, Netflix',
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
                  hintText: 'e.g. Dinner with friends',
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
                          (cat.icon != null && cat.icon!.startsWith('circum:') && circumIcons.containsKey(cat.icon))
                              ? SvgPicture.string(
                                  circumIcons[cat.icon]!,
                                  width: 24,
                                  height: 24,
                                  colorFilter: ColorFilter.mode(
                                      Theme.of(context).colorScheme.onSurface,
                                      BlendMode.srcIn),
                                )
                              : Text(cat.icon ?? '📌',
                                  style: const TextStyle(fontSize: 20)),
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
              const SizedBox(height: 16),

              // Payment Method dropdown
              DropdownButtonFormField<String>(
                value: _selectedPaymentMethod,
                decoration: const InputDecoration(
                  labelText: 'Payment Method',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.payment),
                ),
                isExpanded: true,
                items: ['UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking']
                    .map((method) => DropdownMenuItem(
                          value: method,
                          child: Text(method),
                        ))
                    .toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _selectedPaymentMethod = value);
                  }
                },
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
                label:
                    Text(_isSubmitting ? 'Saving...' : 'Save Transaction'),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ],
          ),
        ),
      ),
    ));
  }
}
