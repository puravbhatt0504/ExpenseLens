// This is a basic Flutter widget test.
//
// To perform an interaction test, add the Flutter "Interaction Test"
// package to your dev dependencies and add an interaction test.

import 'package:flutter_test/flutter_test.dart';
import 'package:expense_lens/main.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  testWidgets('App starts and shows navigation', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const ProviderScope(child: ExpenseLensApp()));

    // Verify that bottom navigation items are present
    expect(find.text('Dashboard'), findsOneWidget);
    expect(find.text('Transactions'), findsOneWidget);
  });
}
