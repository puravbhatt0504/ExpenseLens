import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../providers/providers.dart';
import '../models/summary.dart';
import '../theme/app_theme.dart';
import '../utils/circum_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
class BudgetScreen extends ConsumerStatefulWidget {
  const BudgetScreen({super.key});

  @override
  ConsumerState<BudgetScreen> createState() => _BudgetScreenState();
}

class _BudgetScreenState extends ConsumerState<BudgetScreen> {
  bool _isLoading = false;
  Summary? _currentSummary;

  double? _totalBudget;
  final Map<int, double> _categoryBudgets = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    final summaryAsync = ref.read(summaryProvider);
    summaryAsync.whenData((summary) {
      _currentSummary = summary;
      _totalBudget = summary.totalBudget;
      for (final cat in summary.byCategory) {
        if (cat.categoryId != null && cat.budget != null) {
          _categoryBudgets[cat.categoryId!] = cat.budget!;
        }
      }
      setState(() {});
    });
  }

  Future<void> _saveBudgets() async {
    if (_isLoading) return;
    setState(() => _isLoading = true);
    try {
      final Map<int, double?> budgetsToSave = {};
      
      // We need to pass null for cleared budgets, or just save the ones we have.
      // For simplicity, we just send all categories present in the map, and null for others that had one before.
      for (final cat in _currentSummary!.byCategory) {
        if (cat.categoryId != null) {
          if (_categoryBudgets.containsKey(cat.categoryId)) {
            budgetsToSave[cat.categoryId!] = _categoryBudgets[cat.categoryId!];
          } else if (cat.budget != null) {
            budgetsToSave[cat.categoryId!] = null; // Clear it
          }
        }
      }

      final api = ref.read(apiClientProvider);
      await api.setBudgets(_totalBudget, budgetsToSave);
      
      await ref.read(summaryProvider.notifier).refresh();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Budgets saved!')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save budgets: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_currentSummary == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Set Budgets')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Set Budgets'),
        actions: [
          if (_isLoading)
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
              icon: const Icon(Icons.check),
              onPressed: _saveBudgets,
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 100),
        children: [
          // Total Budget Section
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(32),
                bottomRight: Radius.circular(32),
              ),
            ),
            child: Column(
              children: [
                Text(
                  'Total Monthly Budget',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 16),
                _InteractiveBudgetBar(
                  value: _totalBudget ?? 0,
                  maxLimit: 200000,
                  accentColor: theme.colorScheme.primary,
                  onChanged: (val) {
                    setState(() {
                      _totalBudget = val == 0 ? null : val;
                    });
                  },
                ),
              ],
            ),
          ).animate().slideY(begin: -0.2, end: 0, duration: 400.ms),

          const SizedBox(height: 32),
          
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(
              'Category Budgets',
              style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 16),
          
          ..._currentSummary!.byCategory.where((c) => c.categoryId != null).map((cat) {
            final catBudget = _categoryBudgets[cat.categoryId!] ?? 0.0;
            final color = _parseColor(cat.categoryColor);

            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: theme.cardTheme.color ?? theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: color.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          alignment: Alignment.center,
                          child: (cat.categoryIcon.startsWith('circum:') && circumIcons.containsKey(cat.categoryIcon))
                              ? SvgPicture.string(
                                  circumIcons[cat.categoryIcon]!,
                                  width: 20,
                                  height: 20,
                                  colorFilter: ColorFilter.mode(
                                      Theme.of(context).colorScheme.onSurface,
                                      BlendMode.srcIn),
                                )
                              : Text(cat.categoryIcon, style: const TextStyle(fontSize: 20)),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          cat.categoryName,
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        const Spacer(),
                        if (catBudget == 0)
                          TextButton.icon(
                            onPressed: () {
                              setState(() {
                                _categoryBudgets[cat.categoryId!] = 5000;
                              });
                            },
                            icon: const Icon(Icons.add, size: 16),
                            label: const Text('Add'),
                          )
                        else
                          IconButton(
                            icon: Icon(Icons.close, color: theme.colorScheme.error, size: 20),
                            onPressed: () {
                              setState(() {
                                _categoryBudgets.remove(cat.categoryId!);
                              });
                            },
                          ),
                      ],
                    ),
                    if (catBudget > 0) ...[
                      const SizedBox(height: 16),
                      _InteractiveBudgetBar(
                        value: catBudget,
                        maxLimit: 50000,
                        accentColor: color,
                        onChanged: (val) {
                          setState(() {
                            if (val == 0) {
                              _categoryBudgets.remove(cat.categoryId!);
                            } else {
                              _categoryBudgets[cat.categoryId!] = val;
                            }
                          });
                        },
                      ),
                    ],
                  ],
                ),
              ),
            );
          }),
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

/// A highly interactive graphical slider for setting budgets.
class _InteractiveBudgetBar extends StatelessWidget {
  final double value;
  final double maxLimit;
  final ValueChanged<double> onChanged;
  final Color accentColor;

  const _InteractiveBudgetBar({
    required this.value,
    required this.maxLimit,
    required this.onChanged,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    // Dynamically adjust max so the slider isn't crushed if they go high
    final currentMax = (value > maxLimit * 0.8) ? (value * 1.5).clamp(maxLimit, 1000000.0) : maxLimit;

    return Column(
      children: [
        // Display Value
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(
              '₹',
              style: theme.textTheme.titleLarge?.copyWith(
                color: accentColor,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(width: 4),
            Text(
              value.toStringAsFixed(0),
              style: theme.textTheme.displayMedium?.copyWith(
                fontWeight: FontWeight.w800,
                color: theme.colorScheme.onSurface,
                fontFamily: 'Outfit',
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        // Slider with custom theme
        SliderTheme(
          data: SliderThemeData(
            trackHeight: 12,
            activeTrackColor: accentColor,
            inactiveTrackColor: accentColor.withValues(alpha: 0.1),
            thumbColor: Colors.white,
            overlayColor: accentColor.withValues(alpha: 0.2),
            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 14, elevation: 4),
            trackShape: const RoundedRectSliderTrackShape(),
          ),
          child: Slider(
            value: value.clamp(0, currentMax),
            min: 0,
            max: currentMax,
            divisions: (currentMax / 500).round(), // Snaps to 500 increments
            onChanged: onChanged,
          ),
        ),
        // Plus Minus adjusters
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            IconButton(
              icon: Icon(Icons.remove_circle_outline, color: theme.colorScheme.outline),
              onPressed: () {
                final newVal = (value - 500).clamp(0.0, currentMax);
                onChanged(newVal);
              },
            ),
            Text(
              value == 0 ? 'Not Set' : 'Adjust',
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
            ),
            IconButton(
              icon: Icon(Icons.add_circle_outline, color: theme.colorScheme.outline),
              onPressed: () {
                final newVal = (value + 500).clamp(0.0, currentMax);
                onChanged(newVal);
              },
            ),
          ],
        ),
      ],
    );
  }
}
