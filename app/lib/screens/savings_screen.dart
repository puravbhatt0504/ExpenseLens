import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../providers/providers.dart';
import '../models/savings_goal.dart';
import '../theme/app_theme.dart';

class SavingsScreen extends ConsumerStatefulWidget {
  const SavingsScreen({super.key});

  @override
  ConsumerState<SavingsScreen> createState() => SavingsScreenState();
}

class SavingsScreenState extends ConsumerState<SavingsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _amountController = TextEditingController();
  DateTime? _selectedTargetDate;
  final _isSubmitting = ValueNotifier<bool>(false);

  @override
  void dispose() {
    _nameController.dispose();
    _amountController.dispose();
    _isSubmitting.dispose();
    super.dispose();
  }

  void showAddGoalModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 16,
          right: 16,
          top: 16,
        ),
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Create Savings Goal', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Goal Name', border: OutlineInputBorder()),
                validator: (val) => val == null || val.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(labelText: 'Target Amount', border: OutlineInputBorder(), prefixText: '₹ '),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: (val) => (val == null || double.tryParse(val) == null) ? 'Invalid amount' : null,
              ),
              const SizedBox(height: 12),
              StatefulBuilder(
                builder: (context, setModalState) => OutlinedButton.icon(
                  onPressed: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now().add(const Duration(days: 30)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 3650)),
                    );
                    if (date != null) {
                      setModalState(() => _selectedTargetDate = date);
                      setState(() => _selectedTargetDate = date);
                    }
                  },
                  icon: const Icon(Icons.calendar_today),
                  label: Text(_selectedTargetDate == null
                      ? 'Select Target Date (Optional)'
                      : 'Target: ${DateFormat('MMM yyyy').format(_selectedTargetDate!)}'),
                ),
              ),
              const SizedBox(height: 16),
              ValueListenableBuilder<bool>(
                valueListenable: _isSubmitting,
                builder: (context, isSubmitting, child) {
                  return FilledButton(
                    onPressed: isSubmitting ? null : _submitNewGoal,
                    child: isSubmitting ? const CircularProgressIndicator(color: Colors.white) : const Text('Create Goal'),
                  );
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    ),
  );
}

  Future<void> _submitNewGoal() async {
    if (!_formKey.currentState!.validate()) return;
    if (_isSubmitting.value) return; // Prevent double submission
    _isSubmitting.value = true;
    try {
      final api = ref.read(apiClientProvider);
      await api.createSavingsGoal(
        name: _nameController.text,
        targetAmount: double.parse(_amountController.text),
        targetDate: _selectedTargetDate != null 
            ? '${_selectedTargetDate!.year}-${_selectedTargetDate!.month.toString().padLeft(2, '0')}-${_selectedTargetDate!.day.toString().padLeft(2, '0')}'
            : null,
      );
      ref.invalidate(savingsProvider);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) _isSubmitting.value = false;
    }
  }

  void _showAddFundsModal(int goalId, double currentAmount) {
    final fundController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Funds'),
        content: TextField(
          controller: fundController,
          decoration: const InputDecoration(labelText: 'Amount to add', border: OutlineInputBorder()),
          keyboardType: TextInputType.number,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final val = double.tryParse(fundController.text);
              if (val != null && val > 0) {
                try {
                  final api = ref.read(apiClientProvider);
                  await api.addFundsToGoal(goalId, currentAmount + val);
                  ref.invalidate(savingsProvider);
                  if (mounted) Navigator.pop(context);
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(e.toString().replaceAll('Exception: ', '')),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  Future<void> _showDistributeSavingsModal(double netBalance, List<SavingsGoal> goals) async {
    final activeGoals = goals.where((g) => g.currentAmount < g.targetAmount).toList();
    if (activeGoals.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No active savings goals found.')));
      }
      return;
    }

    final controllers = <int, TextEditingController>{};
    for (var g in activeGoals) {
      controllers[g.id!] = TextEditingController();
    }

    bool isAutoSplit = false;
    try {
      final user = await ref.read(apiClientProvider).getUser();
      isAutoSplit = user['auto_split_savings'] == true;
    } catch (_) {}

    if (!mounted) return;

    await showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setState) {
            double allocated = 0;
            for (var c in controllers.values) {
              allocated += double.tryParse(c.text) ?? 0;
            }
            final remaining = netBalance - allocated;

            return AlertDialog(
              title: Row(
                children: [
                  Icon(Icons.savings, color: Theme.of(context).colorScheme.primary),
                  const SizedBox(width: 8),
                  const Text('Distribute Savings'),
                ],
              ),
              content: SizedBox(
                width: double.maxFinite,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Remaining:', style: TextStyle(fontWeight: FontWeight.bold)),
                          Text('₹${remaining.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextButton.icon(
                      onPressed: () {
                        final split = (netBalance / activeGoals.length).floorToDouble();
                        setState(() {
                          for (var c in controllers.values) {
                            c.text = split.toStringAsFixed(0);
                          }
                        });
                      },
                      icon: const Icon(Icons.call_split),
                      label: const Text('Auto-Split Equally'),
                    ),
                    const SizedBox(height: 12),
                    Flexible(
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: activeGoals.length,
                        itemBuilder: (ctx, i) {
                          final g = activeGoals[i];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              children: [
                                Expanded(child: Text(g.name, overflow: TextOverflow.ellipsis)),
                                SizedBox(
                                  width: 100,
                                  child: TextField(
                                    controller: controllers[g.id!],
                                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                    decoration: const InputDecoration(
                                      prefixText: '₹',
                                      isDense: true,
                                    ),
                                    onChanged: (_) => setState(() {}),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Auto-Split Every Month', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                Text('Automatically split your net balance equally on the last day of every month.', 
                                  style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.outline),
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: isAutoSplit,
                            onChanged: (val) async {
                              setState(() => isAutoSplit = val);
                              try {
                                await ref.read(apiClientProvider).updateAutoSplit(val);
                              } catch (e) {
                                setState(() => isAutoSplit = !val);
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                if (allocated > 0)
                  TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                FilledButton(
                  onPressed: remaining < 0 ? null : () async {
                    Navigator.pop(ctx);
                    if (allocated > 0) {
                      for (var g in activeGoals) {
                        final amount = double.tryParse(controllers[g.id!]!.text) ?? 0;
                        if (amount > 0) {
                          await ref.read(apiClientProvider).addFundsToGoal(g.id!, g.currentAmount + amount);
                        }
                      }
                      ref.invalidate(savingsProvider);
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Savings distributed successfully!')));
                      }
                    }
                  },
                  child: Text(allocated > 0 ? 'Distribute' : 'Done'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final savingsAsync = ref.watch(savingsProvider);
    final summaryAsync = ref.watch(summaryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Savings Goals'),
      ),
      body: Column(
        children: [
          // Net Savings Card
          summaryAsync.when(
            data: (summary) {
              final netSavings = summary.totalIncome - summary.total;
              return Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.secondary]),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.account_balance_wallet, color: Colors.white, size: 40),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Net Monthly Savings', style: TextStyle(color: Colors.white70, fontSize: 14)),
                          Row(
                            children: [
                              Text(
                                '₹${netSavings.toStringAsFixed(0)}',
                                style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                              ),
                              const Spacer(),
                              savingsAsync.when(
                                data: (goals) => ElevatedButton.icon(
                                  onPressed: () => _showDistributeSavingsModal(netSavings, goals),
                                  icon: const Icon(Icons.call_split, size: 16),
                                  label: const Text('Auto-Split'),
                                  style: ElevatedButton.styleFrom(
                                    foregroundColor: AppTheme.primary,
                                    backgroundColor: Colors.white,
                                  ),
                                ),
                                loading: () => const SizedBox.shrink(),
                                error: (_, __) => const SizedBox.shrink(),
                              ),
                            ],
                          ),
                          const Text('Actual Cash Flow (Income - Expenses)', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
              ).animate().fade().slideY();
            },
            loading: () => const SizedBox.shrink(),
            error: (e, _) => const SizedBox.shrink(),
          ),
          
          Expanded(
            child: savingsAsync.when(
              data: (goals) {
          if (goals.isEmpty) {
            return const Center(child: Text('No savings goals yet. Create one!'));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.read(savingsProvider.notifier).refresh(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: goals.length,
              itemBuilder: (context, index) {
                final goal = goals[index];
                final progress = (goal.currentAmount / goal.targetAmount).clamp(0.0, 1.0);
                
                return Dismissible(
                  key: ValueKey(goal.id),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    color: Theme.of(context).colorScheme.error,
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20),
                    child: Icon(Icons.delete_outline, color: Theme.of(context).colorScheme.onError),
                  ),
                  confirmDismiss: (direction) async {
                    return await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Delete Savings Goal?'),
                        content: const Text('Are you sure you want to delete this savings goal?'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                          FilledButton(
                            onPressed: () => Navigator.pop(ctx, true),
                            style: FilledButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error),
                            child: const Text('Delete'),
                          ),
                        ],
                      ),
                    );
                  },
                  onDismissed: (direction) async {
                    try {
                      if (goal.id != null) {
                        await ref.read(apiClientProvider).deleteSavingsGoal(goal.id!);
                        ref.invalidate(savingsProvider);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Savings goal deleted')),
                          );
                        }
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Failed to delete: $e')),
                        );
                        ref.invalidate(savingsProvider);
                      }
                    }
                  },
                  child: Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(goal.name, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                                  if (goal.targetDate != null)
                                    Text('Target: ${DateFormat('MMM yyyy').format(DateTime.parse(goal.targetDate!))}', 
                                        style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                                ],
                              ),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text('₹${goal.currentAmount.toStringAsFixed(0)} / ₹${goal.targetAmount.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  IconButton(
                                    icon: Icon(Icons.delete_outline, color: Theme.of(context).colorScheme.error, size: 20),
                                    onPressed: () async {
                                      final confirm = await showDialog<bool>(
                                        context: context,
                                        builder: (ctx) => AlertDialog(
                                          title: const Text('Delete Savings Goal?'),
                                          content: const Text('Are you sure you want to delete this savings goal?'),
                                          actions: [
                                            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                                            FilledButton(
                                              onPressed: () => Navigator.pop(ctx, true),
                                              style: FilledButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error),
                                              child: const Text('Delete'),
                                            ),
                                          ],
                                        ),
                                      );
                                      if (confirm == true) {
                                        try {
                                          if (goal.id != null) {
                                            await ref.read(apiClientProvider).deleteSavingsGoal(goal.id!);
                                            ref.invalidate(savingsProvider);
                                            if (context.mounted) {
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                const SnackBar(content: Text('Savings goal deleted')),
                                              );
                                            }
                                          }
                                        } catch (e) {
                                          if (context.mounted) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(content: Text('Failed to delete: $e')),
                                            );
                                            ref.invalidate(savingsProvider);
                                          }
                                        }
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: LinearProgressIndicator(
                              value: progress,
                              minHeight: 12,
                              backgroundColor: Colors.grey[200],
                              valueColor: AlwaysStoppedAnimation(progress >= 1.0 ? Colors.green : Colors.blue),
                            ),
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: () => _showAddFundsModal(goal.id!, goal.currentAmount),
                              icon: const Icon(Icons.add),
                              label: const Text('Add Funds'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ).animate().fade().slideY(begin: 0.1, end: 0),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
      ),
    )]));
  }
}
