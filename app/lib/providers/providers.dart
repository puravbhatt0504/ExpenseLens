import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/category.dart';
import '../models/transaction.dart';
import '../models/summary.dart';
import '../models/income.dart';
import '../models/savings_goal.dart';
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

String formatMonth(DateTime date) {
  return '${date.year}-${date.month.toString().padLeft(2, '0')}';
}

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
// Transactions for the selected month (with Caching)
// ---------------------------------------------------------------------------
class TransactionsNotifier extends AsyncNotifier<List<Transaction>> {
  @override
  Future<List<Transaction>> build() async {
    final monthStr = formatMonth(ref.watch(selectedMonthProvider));
    
    // 1. Try to load from cache immediately
    final prefs = await SharedPreferences.getInstance();
    final cachedData = prefs.getString('cache_transactions_$monthStr');
    if (cachedData != null) {
      try {
        final List<dynamic> jsonList = jsonDecode(cachedData);
        final cachedTxns = jsonList.map((json) => Transaction.fromJson(json)).toList();
        // Set the state with cached data right away
        state = AsyncData(cachedTxns);
      } catch (_) {}
    }

    // 2. Fetch fresh data from network in background
    _fetchFresh(monthStr);

    // Return the current state's value (or empty list if no cache)
    return state.value ?? [];
  }

  Future<void> _fetchFresh(String monthStr) async {
    try {
      final api = ref.read(apiClientProvider);
      final freshTxns = await api.getTransactions(monthStr);
      
      // Update cache
      final prefs = await SharedPreferences.getInstance();
      final jsonList = freshTxns.map((t) => t.toJson()).toList();
      await prefs.setString('cache_transactions_$monthStr', jsonEncode(jsonList));
      
      // Update state
      state = AsyncData(freshTxns);
    } catch (e, st) {
      // If we don't have cached data, report the error. Otherwise, keep the cache.
      if (!state.hasValue || state.value!.isEmpty) {
        state = AsyncError(e, st);
      }
    }
  }

  // Allow manual refresh
  Future<void> refresh() async {
    final monthStr = formatMonth(ref.read(selectedMonthProvider));
    state = const AsyncLoading();
    await _fetchFresh(monthStr);
  }
}

final transactionsProvider = AsyncNotifierProvider<TransactionsNotifier, List<Transaction>>(() {
  return TransactionsNotifier();
});

// ---------------------------------------------------------------------------
// Summary for the selected month (with Caching)
// ---------------------------------------------------------------------------
class SummaryNotifier extends AsyncNotifier<Summary> {
  @override
  Future<Summary> build() async {
    final monthStr = formatMonth(ref.watch(selectedMonthProvider));
    
    // Watch transactions and incomes so summary updates if added
    ref.watch(transactionsProvider);
    ref.watch(incomesProvider);
    
    // 1. Try to load from cache immediately
    final prefs = await SharedPreferences.getInstance();
    final cachedData = prefs.getString('cache_summary_$monthStr');
    if (cachedData != null) {
      try {
        final cachedSummary = Summary.fromJson(jsonDecode(cachedData));
        state = AsyncData(cachedSummary);
      } catch (_) {}
    }

    // 2. Fetch fresh data
    _fetchFresh(monthStr);

    return state.value ?? Summary(month: monthStr, total: 0, count: 0, byCategory: []);
  }

  Future<void> _fetchFresh(String monthStr) async {
    try {
      final api = ref.read(apiClientProvider);
      final freshSummary = await api.getSummary(monthStr);
      
      // Update cache
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('cache_summary_$monthStr', jsonEncode(freshSummary.toJson()));
      
      // Update state
      state = AsyncData(freshSummary);
    } catch (e, st) {
      if (!state.hasValue) {
        state = AsyncError(e, st);
      }
    }
  }

  Future<void> refresh() async {
    final monthStr = formatMonth(ref.read(selectedMonthProvider));
    state = const AsyncLoading();
    await _fetchFresh(monthStr);
  }
}

final summaryProvider = AsyncNotifierProvider<SummaryNotifier, Summary>(() {
  return SummaryNotifier();
});

// ---------------------------------------------------------------------------
// Incomes for the selected month
// ---------------------------------------------------------------------------
class IncomesNotifier extends AsyncNotifier<List<Income>> {
  @override
  Future<List<Income>> build() async {
    final monthStr = formatMonth(ref.watch(selectedMonthProvider));
    return _fetchFresh(monthStr);
  }

  Future<List<Income>> _fetchFresh(String monthStr) async {
    try {
      final api = ref.read(apiClientProvider);
      return await api.getIncomes(monthStr);
    } catch (e, st) {
      if (!state.hasValue || state.value!.isEmpty) {
        state = AsyncError(e, st);
      }
      return [];
    }
  }

  Future<void> refresh() async {
    final monthStr = formatMonth(ref.read(selectedMonthProvider));
    state = const AsyncLoading();
    state = AsyncData(await _fetchFresh(monthStr));
  }
}

final incomesProvider = AsyncNotifierProvider<IncomesNotifier, List<Income>>(() {
  return IncomesNotifier();
});

// ---------------------------------------------------------------------------
// Savings Goals
// ---------------------------------------------------------------------------
class SavingsNotifier extends AsyncNotifier<List<SavingsGoal>> {
  @override
  Future<List<SavingsGoal>> build() async {
    return _fetchFresh();
  }

  Future<List<SavingsGoal>> _fetchFresh() async {
    try {
      final api = ref.read(apiClientProvider);
      return await api.getSavingsGoals();
    } catch (e, st) {
      if (!state.hasValue || state.value!.isEmpty) {
        state = AsyncError(e, st);
      }
      return [];
    }
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = AsyncData(await _fetchFresh());
  }
}

final savingsProvider = AsyncNotifierProvider<SavingsNotifier, List<SavingsGoal>>(() {
  return SavingsNotifier();
});
