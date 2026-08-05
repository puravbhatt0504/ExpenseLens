import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/category.dart';
import '../models/transaction.dart';
import '../models/summary.dart';
import '../models/income.dart';
import '../models/savings_goal.dart';

/// API client service wrapping all REST calls to the ExpenseLens backend.
class ApiClient {
  final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // Updated to your deployed API URL
  static const String _baseUrl = 'https://server-seven-gamma-95.vercel.app';

  ApiClient({String? baseUrl})
      : _dio = Dio(
          BaseOptions(
            baseUrl: baseUrl ?? _baseUrl,
            connectTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(seconds: 10),
            headers: {
              'Content-Type': 'application/json',
            },
          ),
        ) {
    _initInterceptors();
  }

  void _initInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Skip token check for auth and public routes
          if (options.path.startsWith('/auth') || options.path.startsWith('/categories')) {
            return handler.next(options);
          }
          
          final token = await _storage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
            return handler.next(options);
          } else {
            // If token is missing for protected routes, throw an error.
            return handler.reject(
              DioException(
                requestOptions: options,
                error: 'Session expired. Please restart the app and log in again.',
              ),
            );
          }
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            // Handle unauthorized (e.g., clear token)
            await _storage.delete(key: 'auth_token');
            error = DioException(
              requestOptions: error.requestOptions,
              response: error.response,
              error: 'Session expired. Please restart the app and log in again.',
            );
          }
          return handler.next(error);
        }
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------
  Future<void> loginWithGoogle(String idToken) async {
    await _dio.post('/auth/login', data: {'idToken': idToken});
    // The backend just returns the user object, and we can keep using the idToken as our API token 
    // since the backend verifies it. Or if the backend returned a custom token, we'd save that.
    // Here we save the Google ID token to send as Bearer for future requests.
    await _storage.write(key: 'auth_token', value: idToken);
  }

  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
  }

  // ---------------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------------

  /// GET /categories — fetch all categories.
  Future<List<Category>> getCategories() async {
    final response = await _dio.get('/categories');
    final List<dynamic> data = response.data;
    return data.map((json) => Category.fromJson(json)).toList();
  }

  /// POST /categories — create a new category.
  Future<Category> createCategory({
    required String name,
    String? icon,
    String? color,
  }) async {
    final body = <String, dynamic>{'name': name};
    if (icon != null) body['icon'] = icon;
    if (color != null) body['color'] = color;

    final response = await _dio.post('/categories', data: body);
    return Category.fromJson(response.data);
  }

  /// GET /summary?month=YYYY-MM — fetch monthly summary and category breakdown.
  Future<Summary> getSummary(String month) async {
    final response = await _dio.get(
      '/summary',
      queryParameters: {'month': month},
    );
    return Summary.fromJson(response.data);
  }

  /// POST /parse-receipt — parse UPI/PhonePe screenshot (legacy)
  Future<Map<String, dynamic>> parseReceipt(String imagePath) async {
    final formData = FormData.fromMap({
      'receipt': await MultipartFile.fromFile(imagePath, filename: 'receipt.jpg'),
    });
    final response = await _dio.post('/parse-receipt', data: formData);
    return response.data as Map<String, dynamic>;
  }

  /// POST /parse-text — parse text extracted from screenshot via ML Kit
  Future<Map<String, dynamic>> parseText(String text) async {
    final response = await _dio.post('/parse-text', data: {'text': text});
    return response.data as Map<String, dynamic>;
  }

  // ---------------------------------------------------------------------------
  // Reports
  // ---------------------------------------------------------------------------

  /// GET /report?month=YYYY-MM — download the PDF report for a given month.
  Future<void> downloadReport(String month, String savePath) async {
    await _dio.download(
      '/report',
      savePath,
      queryParameters: {'month': month},
    );
  }

  // ---------------------------------------------------------------------------
  Future<void> setBudgets(double? totalBudget, Map<int, double?> categoryBudgets) async {
    final Map<String, dynamic> data = {};
    if (totalBudget != null) {
      data['totalBudget'] = totalBudget;
    }
    
    if (categoryBudgets.isNotEmpty) {
      final Map<String, dynamic> categoryBudgetsMap = {};
      categoryBudgets.forEach((key, value) {
        categoryBudgetsMap[key.toString()] = value;
      });
      data['categoryBudgets'] = categoryBudgetsMap;
    }

    await _dio.put('/budgets', data: data);
  }

  // --- Transactions ---
  // ---------------------------------------------------------------------------

  /// POST /transactions — create a transaction.
  Future<Transaction> createTransaction({
    required double amount,
    required String txnDate,
    String? merchant,
    String? note,
    int? categoryId,
    required String source,
    String? paymentMethod,
    Map<String, dynamic>? rawExtracted,
    int? suggestedCategoryId,
  }) async {
    final body = <String, dynamic>{
      'amount': amount,
      'txn_date': txnDate,
      'source': source,
    };
    if (merchant != null) body['merchant'] = merchant;
    if (note != null) body['note'] = note;
    if (categoryId != null) body['category_id'] = categoryId;
    if (paymentMethod != null) body['payment_method'] = paymentMethod;
    if (rawExtracted != null) body['raw_extracted'] = rawExtracted;
    if (suggestedCategoryId != null) body['suggested_category_id'] = suggestedCategoryId;

    final response = await _dio.post('/transactions', data: body);
    return Transaction.fromJson(response.data);
  }


  /// GET /transactions?month=YYYY-MM — fetch transactions for a given month.
  Future<List<Transaction>> getTransactions(String month) async {
    final response = await _dio.get(
      '/transactions',
      queryParameters: {'month': month},
    );
    final List<dynamic> data = response.data;
    return data.map((json) => Transaction.fromJson(json)).toList();
  }

  /// PATCH /transactions/:id — update a transaction.
  Future<Transaction> updateTransaction(
    int id,
    Map<String, dynamic> fields,
  ) async {
    final response = await _dio.patch('/transactions/$id', data: fields);
    return Transaction.fromJson(response.data);
  }

  /// DELETE /transactions/:id — delete a transaction.
  Future<void> deleteTransaction(int id) async {
    await _dio.delete('/transactions/$id');
  }

  // ---------------------------------------------------------------------------
  // Incomes
  // ---------------------------------------------------------------------------

  Future<List<Income>> getIncomes(String month) async {
    final response = await _dio.get('/incomes', queryParameters: {'month': month});
    final List<dynamic> data = response.data;
    return data.map((json) => Income.fromJson(json)).toList();
  }

  Future<Income> createIncome({
    required double amount,
    required String date,
    String? source,
    String? note,
    String? paymentMethod,
  }) async {
    final body = <String, dynamic>{
      'amount': amount,
      'date': date,
    };
    if (source != null) body['source'] = source;
    if (note != null) body['note'] = note;
    if (paymentMethod != null) body['payment_method'] = paymentMethod;

    final response = await _dio.post('/incomes', data: body);
    return Income.fromJson(response.data);
  }

  // ---------------------------------------------------------------------------
  // Savings
  // ---------------------------------------------------------------------------

  Future<List<SavingsGoal>> getSavingsGoals() async {
    final response = await _dio.get('/savings');
    final List<dynamic> data = response.data;
    return data.map((json) => SavingsGoal.fromJson(json)).toList();
  }

  Future<SavingsGoal> createSavingsGoal({
    required String name,
    required double targetAmount,
    String? targetDate,
  }) async {
    final body = <String, dynamic>{
      'name': name,
      'target_amount': targetAmount,
    };
    if (targetDate != null) body['target_date'] = targetDate;
    
    final response = await _dio.post('/savings', data: body);
    return SavingsGoal.fromJson(response.data);
  }

  Future<SavingsGoal> addFundsToGoal(int id, double currentAmount) async {
    final response = await _dio.patch('/savings/$id', data: {
      'current_amount': currentAmount,
    });
    return SavingsGoal.fromJson(response.data);
  }
}
