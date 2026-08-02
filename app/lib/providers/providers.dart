import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/category.dart';
import '../models/transaction.dart';
import '../models/summary.dart';
import '../services/api_client.dart';

// ---------------------------------------------------------------------------
// API Client provider
// ---------------------------------------------------------------------------
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

// ---------------------------------------------------------------------------
// Selected month — shared between Dashboard and Transaction List
// ---------------------------------------------------------------------------
final selectedMonthProvider = StateProvider<DateTime>((ref) {
  final now = DateTime.now();
  return DateTime(now.year, now.month);
});

/// Formats a DateTime to YYYY-MM string for the API.
String formatMonth(DateTime date) {
  return '${date.year}-${date.month.toString().padLeft(2, '0')}';
}

/// Returns a human-readable month string like "August 2026".
String formatMonthDisplay(DateTime date) {
  const months = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return '${months[date.month]} ${date.year}';
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  final api = ref.read(apiClientProvider);
  return api.getCategories();
});

// ---------------------------------------------------------------------------
// Transactions for the selected month
// ---------------------------------------------------------------------------
final transactionsProvider = FutureProvider<List<Transaction>>((ref) async {
  final api = ref.read(apiClientProvider);
  final month = ref.watch(selectedMonthProvider);
  return api.getTransactions(formatMonth(month));
});

// ---------------------------------------------------------------------------
// Summary for the selected month
// ---------------------------------------------------------------------------
final summaryProvider = FutureProvider<Summary>((ref) async {
  final api = ref.read(apiClientProvider);
  final month = ref.watch(selectedMonthProvider);
  
  // Make sure to reload summary if transactions change (e.g. new transaction added)
  // Watching transactionsProvider ensures we refresh when it invalidates.
  ref.watch(transactionsProvider);
  
  return api.getSummary(formatMonth(month));
});
