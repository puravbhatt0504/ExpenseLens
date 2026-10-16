import 'package:flutter_test/flutter_test.dart';
import 'package:expense_lens/utils/currency.dart';

void main() {
  test('formats per selected currency', () {
    Money.setCode('INR');
    expect(Money.symbol, '₹');
    expect(Money.format(1234.5), '₹1,234.50');
    expect(Money.format(1234.5, 0), '₹1,235');

    Money.setCode('PHP');
    expect(Money.symbol, '₱');
    expect(Money.format(1234.5), '₱1,234.50');
  });

  test('unknown or missing code falls back to the default', () {
    Money.setCode('XYZ');
    expect(Money.code, Money.defaultCode);

    Money.setCode(null);
    expect(Money.code, Money.defaultCode);
    expect(Money.symbol, '₹');
  });
}
