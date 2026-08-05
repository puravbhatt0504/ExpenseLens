import 'package:dio/dio.dart';
import 'lib/services/api_client.dart';

void main() async {
  // Use localhost for local backend testing
  final api = ApiClient(baseUrl: 'http://localhost:3000');
  
  try {
    print('-----------------------------------------');
    print('Testing App Features against Local Backend');
    print('-----------------------------------------');

    print('1. Creating Income...');
    final income = await api.createIncome(
      amount: 15000,
      date: '2026-08-05',
      source: 'App Test Script',
      paymentMethod: 'Bank Transfer'
    );
    print('✅ Income created: ₹\${income.amount}');

    print('\n2. Fetching Incomes...');
    final incomes = await api.getIncomes('2026-08');
    print('✅ Incomes count for Aug 2026: \${incomes.length}');
    
    print('\n3. Creating Savings Goal...');
    final goal = await api.createSavingsGoal(
      name: 'App Test Goal',
      targetAmount: 50000,
    );
    print('✅ Goal created: \${goal.name} with target ₹\${goal.targetAmount}');
    
    print('\n4. Adding Funds to Goal...');
    final updatedGoal = await api.addFundsToGoal(goal.id!, 10000);
    print('✅ Goal updated: ₹\${updatedGoal.currentAmount} / ₹\${updatedGoal.targetAmount}');
    
    print('\n5. Creating Transaction with Payment Method...');
    // We need a dummy category for this test or just pass null if it accepts null
    final txn = await api.createTransaction(
      amount: 250,
      txnDate: '2026-08-05',
      merchant: 'App Test Merchant',
      source: 'manual',
      paymentMethod: 'UPI'
    );
    print('✅ Transaction created: ₹\${txn.amount} via \${txn.paymentMethod ?? "Unknown"}');

    print('\n6. Fetching Summary (Dashboard)...');
    final summary = await api.getSummary('2026-08');
    print('✅ Dashboard Summary:');
    print('   Total Income: ₹\${summary.totalIncome}');
    print('   Total Spend: ₹\${summary.total}');
    print('   Net Balance: ₹\${summary.totalIncome - summary.total}');

    print('\n🎉 All app features tested successfully!');
  } catch (e) {
    if (e is DioException) {
      print('❌ Dio error: \${e.response?.data}');
    } else {
      print('❌ Error: \$e');
    }
  }
}
