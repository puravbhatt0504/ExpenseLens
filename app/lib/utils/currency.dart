import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Display currency. Amounts are stored as plain numbers and never
/// converted — this only decides the symbol and digit grouping.
///
///   Money.symbol            → '₱'   (after setCode('PHP'))
///   Money.format(1234.5)    → '₱1,234.50'
///   Money.format(1234.5, 0) → '₱1,235'
class Money {
  static const Map<String, (String symbol, String locale)> currencies = {
    'INR': ('₹', 'en_IN'),
    'PHP': ('₱', 'en_PH'),
  };

  static const String defaultCode = 'INR';

  static String _code = defaultCode;

  static String get code => _code;

  static const String _prefsKey = 'display_currency';

  /// Set from the `currency` field on `/auth/me`. Unknown codes fall back
  /// to the default rather than throwing — a server that learns a new
  /// currency before the app does shouldn't crash the dashboard.
  static void setCode(String? code) {
    _code = currencies.containsKey(code) ? code! : defaultCode;
  }

  /// Adopt a code and remember it, so the next cold start renders the right
  /// symbol immediately instead of flashing the default until /auth/me lands.
  static Future<void> adopt(String? code) async {
    setCode(code);
    (await SharedPreferences.getInstance()).setString(_prefsKey, _code);
  }

  /// Called once from main() before the first frame.
  static Future<void> restore() async {
    setCode((await SharedPreferences.getInstance()).getString(_prefsKey));
  }

  static String get symbol => currencies[_code]!.$1;

  static String format(num amount, [int decimals = 2]) => NumberFormat.currency(
        locale: currencies[_code]!.$2,
        symbol: symbol,
        decimalDigits: decimals,
      ).format(amount);
}
