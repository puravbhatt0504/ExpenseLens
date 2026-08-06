import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/transaction.dart';
import '../providers/providers.dart';
import '../widgets/month_switcher.dart';

/// Transaction List screen — shows transactions grouped by date for the selected month.
class TransactionListScreen extends ConsumerStatefulWidget {
  const TransactionListScreen({super.key});

  @override
  ConsumerState<TransactionListScreen> createState() => _TransactionListScreenState();
}

class _TransactionListScreenState extends ConsumerState<TransactionListScreen> {
  String _groupBy = 'date';

  @override
  Widget build(BuildContext context) {
    final transactionsAsync = ref.watch(transactionsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transactions'),
      ),
      body: Column(
        children: [
          // Month switcher
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: MonthSwitcher(),
          ),
          
          // Grouping controls
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text('Group by: ', style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.outline,
                )),
                const SizedBox(width: 8),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'date', label: Text('Date'), icon: Icon(Icons.calendar_today, size: 16)),
                    ButtonSegment(value: 'category', label: Text('Category'), icon: Icon(Icons.category, size: 16)),
                  ],
                  selected: {_groupBy},
                  onSelectionChanged: (set) {
                    setState(() => _groupBy = set.first);
                  },
                  showSelectedIcon: false,
                  style: SegmentedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),

          // Transaction list
          Expanded(
            child: transactionsAsync.when(
              data: (transactions) {
                if (transactions.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.receipt_long_outlined,
                            size: 64,
                            color: theme.colorScheme.outline),
                        const SizedBox(height: 16),
                        Text(
                          'No transactions this month',
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: theme.colorScheme.outline,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Tap + to add one',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.outline,
                          ),
                        ),
                      ],
                    ),
                  );
                }

                // Group transactions
                final grouped = _groupBy == 'date' ? _groupByDate(transactions) : _groupByCategory(transactions);
                final groupKeys = grouped.keys.toList();

                return RefreshIndicator(
                  onRefresh: () async {
                    await ref.read(transactionsProvider.notifier).refresh();
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.only(bottom: 80),
                    itemCount: groupKeys.length,
                    itemBuilder: (context, index) {
                      final groupKey = groupKeys[index];
                      final items = grouped[groupKey]!;
                      final dayTotal = items.fold<double>(
                          0, (sum, t) => sum + t.amount);

                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Container(
                          decoration: BoxDecoration(
                            color: theme.cardTheme.color ?? theme.colorScheme.surface,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 16,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Date header
                              Padding(
                                padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      _formatHeader(groupKey, _groupBy),
                                      style: theme.textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.w700,
                                        color: theme.colorScheme.onSurface,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        '₹${dayTotal.toStringAsFixed(0)}',
                                        style: theme.textTheme.titleSmall?.copyWith(
                                          fontWeight: FontWeight.w800,
                                          color: theme.colorScheme.onSurfaceVariant,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Divider(height: 1, color: theme.colorScheme.outlineVariant.withValues(alpha: 0.2)),

                              // Transaction items for this date
                              ...items.map((txn) => _TransactionTile(transaction: txn)),
                              const SizedBox(height: 8),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error_outline,
                        size: 48, color: theme.colorScheme.error),
                    const SizedBox(height: 16),
                    Text('Failed to load transactions',
                        style: theme.textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text('$err',
                        style: theme.textTheme.bodySmall,
                        textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    FilledButton.tonal(
                      onPressed: () => ref.invalidate(transactionsProvider),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Group transactions by their date string (YYYY-MM-DD).
  Map<String, List<Transaction>> _groupByDate(List<Transaction> transactions) {
    final map = <String, List<Transaction>>{};
    for (final txn in transactions) {
      // txnDate comes as ISO string, extract the date part
      final dateKey = txn.txnDate.substring(0, 10);
      map.putIfAbsent(dateKey, () => []).add(txn);
    }
    return map;
  }

  Map<String, List<Transaction>> _groupByCategory(List<Transaction> transactions) {
    final map = <String, List<Transaction>>{};
    for (final txn in transactions) {
      final key = txn.categoryName ?? 'Uncategorized';
      map.putIfAbsent(key, () => []).add(txn);
    }
    
    // Sort groups by total amount (descending)
    final sortedKeys = map.keys.toList()..sort((a, b) {
      final sumA = map[a]!.fold<double>(0, (sum, t) => sum + t.amount);
      final sumB = map[b]!.fold<double>(0, (sum, t) => sum + t.amount);
      return sumB.compareTo(sumA);
    });
    
    final sortedMap = <String, List<Transaction>>{};
    for (var k in sortedKeys) {
      sortedMap[k] = map[k]!;
    }
    return sortedMap;
  }

  /// Format a group key to a human-readable header.
  String _formatHeader(String key, String groupBy) {
    if (groupBy == 'category') return key;
    try {
      final date = DateTime.parse(key);
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const months = [
        '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return '${days[date.weekday - 1]}, ${date.day} ${months[date.month]}';
    } catch (_) {
      return key;
    }
  }
}

/// A single transaction list tile showing icon, merchant, category, and amount.
class _TransactionTile extends ConsumerWidget {
  final Transaction transaction;

  const _TransactionTile({required this.transaction});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final iconText = transaction.categoryIcon ?? '📌';
    final categoryColor = _parseColor(transaction.categoryColor);

    return Dismissible(
      key: ValueKey(transaction.id),
      direction: DismissDirection.endToStart,
      background: Container(
        color: theme.colorScheme.error,
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: Icon(Icons.delete_outline, color: theme.colorScheme.onError),
      ),
      confirmDismiss: (direction) async {
        return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Delete Transaction?'),
            content: const Text('Are you sure you want to delete this transaction?'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
              FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                style: FilledButton.styleFrom(backgroundColor: theme.colorScheme.error),
                child: const Text('Delete'),
              ),
            ],
          ),
        );
      },
      onDismissed: (direction) async {
        try {
          if (transaction.id != null) {
            await ref.read(apiClientProvider).deleteTransaction(transaction.id!);
            ref.invalidate(transactionsProvider);
            ref.invalidate(summaryProvider);
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Transaction deleted')),
              );
            }
          }
        } catch (e) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Failed to delete: $e')),
            );
            ref.invalidate(transactionsProvider);
          }
        }
      },
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
        onTap: () {
          // Open AddTransactionScreen in edit mode
          Navigator.pushNamed(context, '/add-transaction', arguments: transaction);
        },
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: categoryColor.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(16),
          ),
          alignment: Alignment.center,
          child: Text(iconText, style: const TextStyle(fontSize: 24)),
        ),
        title: Text(
          transaction.merchant ?? transaction.note ?? 'Transaction',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          transaction.categoryName ?? 'Uncategorized',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.outline,
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '₹${transaction.amount.toStringAsFixed(0)}',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            IconButton(
              icon: Icon(Icons.delete_outline, color: theme.colorScheme.error, size: 20),
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Delete Transaction?'),
                    content: const Text('Are you sure you want to delete this transaction?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                      FilledButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        style: FilledButton.styleFrom(backgroundColor: theme.colorScheme.error),
                        child: const Text('Delete'),
                      ),
                    ],
                  ),
                );
                if (confirm == true) {
                  try {
                    if (transaction.id != null) {
                      await ref.read(apiClientProvider).deleteTransaction(transaction.id!);
                      ref.invalidate(transactionsProvider);
                      ref.invalidate(summaryProvider);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Transaction deleted')),
                        );
                      }
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Failed to delete: $e')),
                      );
                      ref.invalidate(transactionsProvider);
                    }
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Color _parseColor(String? hex) {
    if (hex == null || hex.isEmpty) return Colors.grey;
    try {
      final colorInt = int.parse(hex.replaceFirst('#', ''), radix: 16);
      return Color(0xFF000000 | colorInt);
    } catch (_) {
      return Colors.grey;
    }
  }
}
