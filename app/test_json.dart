import 'dart:convert';
import 'lib/models/savings_goal.dart';

void main() {
  final jsonStr = '''
  {
    "id": 1,
    "user_id": 1,
    "name": "Ps5",
    "target_amount": 85000.00,
    "current_amount": 0.00,
    "target_date": "2026-12-31T18:30:00.000Z",
    "icon": "🎯",
    "color": "#10b981",
    "created_at": "2026-08-05T22:53:24.258Z"
  }
  ''';
  
  try {
    final Map<String, dynamic> jsonMap = jsonDecode(jsonStr);
    final goal = SavingsGoal.fromJson(jsonMap);
    print('Success: \${goal.name} with target \${goal.targetAmount}');
  } catch (e, st) {
    print('Error: \$e');
    print(st);
  }
}
