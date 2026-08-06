import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
import '../providers/providers.dart';
import '../widgets/month_switcher.dart';
import '../theme/app_theme.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// Dashboard screen — displays monthly spend, income, and category breakdown chart.
class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  bool _isDownloading = false;

  Future<void> _downloadReport() async {
    setState(() => _isDownloading = true);
    
    try {
      final month = ref.read(selectedMonthProvider);
      final monthStr = '${month.year}-${month.month.toString().padLeft(2, '0')}';
      
      final dir = await getApplicationDocumentsDirectory();
      final filePath = '${dir.path}/ExpenseReport_$monthStr.pdf';
      
      final api = ref.read(apiClientProvider);
      await api.downloadReport(monthStr, filePath);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Report saved to $filePath'),
            action: SnackBarAction(
              label: 'Open',
              onPressed: () => OpenFilex.open(filePath),
            ),
          ),
        );
        OpenFilex.open(filePath);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to download report: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isDownloading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final summaryAsync = ref.watch(summaryProvider);
    final savingsAsync = ref.watch(savingsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('ExpenseLens'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.account_balance_wallet_outlined),
            tooltip: 'Set Budget',
            onPressed: () {
              Navigator.pushNamed(context, '/budget');
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: () async {
              await ref.read(apiClientProvider).logout();
              if (mounted) {
                Navigator.pushReplacementNamed(context, '/login');
              }
            },
          ),
          if (_isDownloading)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.picture_as_pdf),
              tooltip: 'Download Report',
              onPressed: _downloadReport,
            ),
        ],
      ),
      body: Column(
        children: [
          // Month switcher
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: MonthSwitcher(),
          ),

          Expanded(
            child: summaryAsync.when(
              data: (summary) {
                final netBalance = summary.totalIncome - summary.total;
                final isPositive = netBalance >= 0;

                return RefreshIndicator(
                  onRefresh: () async {
                    await ref.read(summaryProvider.notifier).refresh();
                  },
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        // Top row of metrics
                        Row(
                          children: [
                            Expanded(
                              child: _buildMetricCard(
                                title: 'Net Balance',
                                amount: '₹${netBalance.abs().toStringAsFixed(0)}',
                                prefix: isPositive ? '+' : '-',
                                color: isPositive ? Colors.green : Colors.red,
                                icon: Icons.scale_rounded,
                              ).animate().fade(duration: 500.ms).slideY(begin: 0.2, end: 0),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildMetricCard(
                                title: 'Income',
                                amount: '₹${summary.totalIncome.toStringAsFixed(0)}',
                                color: Colors.green,
                                icon: Icons.trending_up,
                              ).animate().fade(duration: 500.ms, delay: 100.ms).slideY(begin: 0.2, end: 0),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _buildMetricCard(
                          title: 'Spend',
                          amount: '₹${summary.total.toStringAsFixed(0)}',
                          color: Colors.red,
                          icon: Icons.trending_down,
                          budgetInfo: summary.totalBudget != null ? {
                            'total': summary.totalBudget!,
                            'spent': summary.total,
                          } : null,
                        ).animate().fade(duration: 500.ms, delay: 200.ms).slideY(begin: 0.2, end: 0),

                        const SizedBox(height: 32),

                        // Cash Flow Chart
                        if (summary.totalIncome > 0 || summary.total > 0) ...[
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: theme.cardTheme.color ?? theme.colorScheme.surface,
                              borderRadius: BorderRadius.circular(32),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 20,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Cash Flow',
                                  style: theme.textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(height: 32),
                                SizedBox(
                                  height: 250,
                                  child: BarChart(
                                    BarChartData(
                                      alignment: BarChartAlignment.spaceAround,
                                      maxY: (summary.totalIncome > summary.total ? summary.totalIncome : summary.total) * 1.2,
                                      barTouchData: BarTouchData(enabled: true),
                                      titlesData: FlTitlesData(
                                        show: true,
                                        bottomTitles: AxisTitles(
                                          sideTitles: SideTitles(
                                            showTitles: true,
                                            getTitlesWidget: (value, meta) {
                                              return Padding(
                                                padding: const EdgeInsets.only(top: 8.0),
                                                child: Text(
                                                  value == 0 ? 'Income' : 'Spend',
                                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                                ),
                                              );
                                            },
                                          ),
                                        ),
                                        leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                      ),
                                      gridData: const FlGridData(show: false),
                                      borderData: FlBorderData(show: false),
                                      barGroups: [
                                        BarChartGroupData(
                                          x: 0,
                                          barRods: [
                                            BarChartRodData(
                                              toY: summary.totalIncome,
                                              color: Colors.green,
                                              width: 40,
                                              borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                                            ),
                                          ],
                                        ),
                                        BarChartGroupData(
                                          x: 1,
                                          barRods: [
                                            BarChartRodData(
                                              toY: summary.total,
                                              color: Colors.red,
                                              width: 40,
                                              borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ).animate().fade(duration: 500.ms, delay: 300.ms).slideY(begin: 0.2, end: 0),
                          const SizedBox(height: 32),
                        ],

                        // Category breakdown chart
                        if (summary.total > 0 && summary.byCategory.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: theme.cardTheme.color ?? theme.colorScheme.surface,
                              borderRadius: BorderRadius.circular(32),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 20,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Expense Breakdown',
                                  style: theme.textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(height: 32),
                                SizedBox(
                                  height: 250,
                                  child: Stack(
                                    children: [
                                      PieChart(
                                        PieChartData(
                                          sectionsSpace: 4,
                                          centerSpaceRadius: 80,
                                          sections: summary.byCategory.map((cat) {
                                            final isZero = cat.amount <= 0;
                                            return PieChartSectionData(
                                              color: _parseColor(cat.categoryColor),
                                              value: isZero ? 0.001 : cat.amount,
                                              title: '',
                                              radius: 35,
                                            );
                                          }).toList(),
                                        ),
                                      ),
                                      Center(
                                        child: Column(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              'Total Spend',
                                              style: theme.textTheme.bodyMedium?.copyWith(
                                                color: theme.colorScheme.outline,
                                              ),
                                            ),
                                            Text(
                                              '₹${summary.total.toStringAsFixed(0)}',
                                              style: theme.textTheme.headlineSmall?.copyWith(
                                                fontWeight: FontWeight.w800,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 32),
                                // Legend
                                ...summary.byCategory.map((cat) {
                                  final percentage = (cat.amount / summary.total) * 100;
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 16),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 48,
                                          height: 48,
                                          decoration: BoxDecoration(
                                            color: _parseColor(cat.categoryColor).withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(16),
                                          ),
                                          alignment: Alignment.center,
                                          child: Text(cat.categoryIcon, style: const TextStyle(fontSize: 24)),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                cat.categoryName,
                                                style: theme.textTheme.titleMedium?.copyWith(
                                                  fontWeight: FontWeight.w700,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                '${percentage.toStringAsFixed(1)}%',
                                                style: theme.textTheme.bodySmall?.copyWith(
                                                  color: theme.colorScheme.outline,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                              if (cat.budget != null && cat.budget! > 0) ...[
                                                const SizedBox(height: 8),
                                                Row(
                                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                  children: [
                                                    Text(
                                                      'Budget: ₹${cat.budget!.toStringAsFixed(0)}',
                                                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
                                                    ),
                                                    Text(
                                                      '${((cat.amount / cat.budget!) * 100).clamp(0, 100).toStringAsFixed(1)}%',
                                                      style: theme.textTheme.bodySmall?.copyWith(
                                                        color: cat.amount > cat.budget! ? Colors.redAccent : theme.colorScheme.primary,
                                                        fontWeight: FontWeight.w700,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                const SizedBox(height: 4),
                                                ClipRRect(
                                                  borderRadius: BorderRadius.circular(4),
                                                  child: LinearProgressIndicator(
                                                    value: (cat.amount / cat.budget!).clamp(0.0, 1.0),
                                                    backgroundColor: theme.colorScheme.surfaceContainerHighest,
                                                    valueColor: AlwaysStoppedAnimation<Color>(
                                                      cat.amount > cat.budget! ? Colors.redAccent : _parseColor(cat.categoryColor),
                                                    ),
                                                    minHeight: 4,
                                                  ),
                                                ),
                                              ],
                                            ],
                                          ),
                                        ),
                                        Text(
                                          '₹${cat.amount.toStringAsFixed(0)}',
                                          style: theme.textTheme.titleMedium?.copyWith(
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                }),
                              ],
                            ),
                          ).animate().fade(duration: 500.ms, delay: 400.ms).slideY(begin: 0.2, end: 0)
                        else if (summary.total == 0)
                          Container(
                            padding: const EdgeInsets.all(40),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                              borderRadius: BorderRadius.circular(32),
                            ),
                            child: Column(
                              children: [
                                Icon(Icons.pie_chart_outline, size: 80, color: theme.colorScheme.outlineVariant),
                                const SizedBox(height: 24),
                                Text(
                                  'No spending yet',
                                  style: theme.textTheme.titleLarge?.copyWith(
                                    color: theme.colorScheme.outline,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'Add some transactions to see your beautiful category breakdown.',
                                  textAlign: TextAlign.center,
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    color: theme.colorScheme.outline,
                                    height: 1.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        
                        const SizedBox(height: 32),
                        
                        // Active Savings Goals
                        savingsAsync.when(
                          data: (savings) {
                            if (savings.isEmpty) return const SizedBox.shrink();
                            
                            return Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: theme.cardTheme.color ?? theme.colorScheme.surface,
                                borderRadius: BorderRadius.circular(32),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.05),
                                    blurRadius: 20,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(Icons.savings_outlined, color: theme.colorScheme.primary),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Active Savings Goals',
                                        style: theme.textTheme.titleLarge?.copyWith(
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 24),
                                  ...savings.map((goal) {
                                    final progress = (goal.currentAmount / goal.targetAmount).clamp(0.0, 1.0);
                                    final isComplete = progress >= 1.0;
                                    
                                    return Padding(
                                      padding: const EdgeInsets.only(bottom: 16),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  goal.name,
                                                  style: theme.textTheme.titleMedium?.copyWith(
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                              Text(
                                                '${(progress * 100).toStringAsFixed(1)}%',
                                                style: theme.textTheme.bodySmall?.copyWith(
                                                  fontWeight: FontWeight.bold,
                                                  color: isComplete ? Colors.green : theme.colorScheme.primary,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                '₹${goal.currentAmount.toStringAsFixed(0)}',
                                                style: theme.textTheme.bodyMedium?.copyWith(
                                                  fontWeight: FontWeight.bold,
                                                  color: isComplete ? Colors.green : theme.colorScheme.primary,
                                                ),
                                              ),
                                              Text(
                                                '/ ₹${goal.targetAmount.toStringAsFixed(0)}',
                                                style: theme.textTheme.bodySmall?.copyWith(
                                                  color: theme.colorScheme.outline,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 8),
                                          ClipRRect(
                                            borderRadius: BorderRadius.circular(4),
                                            child: LinearProgressIndicator(
                                              value: progress,
                                              backgroundColor: theme.colorScheme.surfaceContainerHighest,
                                              valueColor: AlwaysStoppedAnimation<Color>(
                                                isComplete ? Colors.green : theme.colorScheme.primary,
                                              ),
                                              minHeight: 6,
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }),
                                ],
                              ),
                            ).animate().fade(duration: 500.ms, delay: 500.ms).slideY(begin: 0.2, end: 0);
                          },
                          loading: () => const SizedBox.shrink(),
                          error: (_, __) => const SizedBox.shrink(),
                        ),
                        
                        const SizedBox(height: 16),
                      ],
                    ),
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
                    Text('Failed to load summary', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 16),
                    FilledButton.tonal(
                      onPressed: () => ref.invalidate(summaryProvider),
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

  Widget _buildMetricCard({
    required String title,
    required String amount,
    String? prefix,
    required Color color,
    required IconData icon,
    Map<String, double>? budgetInfo,
  }) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: theme.dividerColor.withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 8),
              Text(
                title.toUpperCase(),
                style: theme.textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                  color: theme.colorScheme.outline,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '${prefix ?? ''}$amount',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w900,
              color: color == Colors.red ? theme.colorScheme.onSurface : color,
            ),
          ),
          if (budgetInfo != null && budgetInfo['total']! > 0) ...[
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Budget: ₹${budgetInfo['total']!.toStringAsFixed(0)}',
                  style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.outline),
                ),
                Text(
                  '${((budgetInfo['spent']! / budgetInfo['total']!) * 100).clamp(0, 100).toStringAsFixed(1)}%',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: budgetInfo['spent']! > budgetInfo['total']! ? Colors.red : Colors.green,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: (budgetInfo['spent']! / budgetInfo['total']!).clamp(0.0, 1.0),
                backgroundColor: theme.colorScheme.surfaceContainerHighest,
                valueColor: AlwaysStoppedAnimation<Color>(
                  budgetInfo['spent']! > budgetInfo['total']! ? Colors.red : Colors.green,
                ),
                minHeight: 6,
              ),
            ),
          ],
        ],
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
