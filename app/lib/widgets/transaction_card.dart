import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../models/transaction.dart';
import '../models/category.dart';
import '../theme/app_theme.dart';
import '../utils/circum_icons.dart';

class TransactionCard extends StatelessWidget {
  final Transaction transaction;
  final Category? category;
  final VoidCallback? onTap;

  const TransactionCard({
    super.key,
    required this.transaction,
    this.category,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final amountColor = AppTheme.textPrimary;
    final currencyFormatter = NumberFormat.currency(symbol: '₹', decimalDigits: 0);
    final isCategorized = category != null;
    final iconColor = isCategorized ? _parseColor(category!.color) : Colors.grey;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Icon
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: isCategorized
                        ? _parseColor(category!.color).withValues(alpha: 0.15)
                        : Colors.grey.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Center(
                    child: _buildIcon(category?.icon, iconColor),
                  ),
                ),
                const SizedBox(width: 16),

                // Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        transaction.merchant ?? 'Unknown Merchant',
                        style: GoogleFonts.outfit(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isCategorized ? category!.name : 'Uncategorized',
                        style: GoogleFonts.outfit(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),

                // Amount & Date
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      currencyFormatter.format(transaction.amount),
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: amountColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      DateFormat('MMM dd').format(DateTime.parse(transaction.txnDate)),
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _parseColor(String? hexColor) {
    if (hexColor == null || hexColor.isEmpty) return AppTheme.primary;
    final hexCode = hexColor.replaceAll('#', '');
    if (hexCode.length == 6) {
      return Color(int.parse('FF$hexCode', radix: 16));
    }
    return AppTheme.primary;
  }

  /// Maps category icon string keys to Hugeicons stroke-rounded SVG data.
  /// Returns `List<List<dynamic>>` as expected by HugeIcon widget.
  /// 🍎 Food: apple icon (healthy choice instead of burger)
  /// 🔲 Other/default: grid view icon
  Widget _buildIcon(String? iconName, Color color) {
    if (iconName != null && iconName.startsWith('circum:')) {
      final svgString = circumIcons[iconName];
      if (svgString != null) {
        return SvgPicture.string(
          svgString,
          width: 24,
          height: 24,
          colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
        );
      }
    }
    return HugeIcon(
      icon: _getCategoryIconData(iconName),
      color: color,
      size: 24.0,
    );
  }

  List<List<dynamic>> _getCategoryIconData(String? iconName) {
    switch (iconName) {
      // 🍎 Food: apple icon for a healthy look
      case 'fastfood':
      case 'food':
      case 'restaurant':
        return HugeIcons.strokeRoundedApple01;

      case 'directions_car':
      case 'car':
      case 'transport':
        return HugeIcons.strokeRoundedCar01;

      case 'shopping_cart':
      case 'shopping':
        return HugeIcons.strokeRoundedShoppingCart01;

      case 'receipt':
      case 'bills':
        return HugeIcons.strokeRoundedReceiptDollar;

      case 'home':
      case 'house':
        return HugeIcons.strokeRoundedHome01;

      case 'movie':
      case 'entertainment':
        return HugeIcons.strokeRoundedFilm01;

      case 'local_hospital':
      case 'health':
      case 'medical':
        return HugeIcons.strokeRoundedHospital01;

      case 'school':
      case 'education':
        return HugeIcons.strokeRoundedSchool01;

      case 'flight':
      case 'travel':
        return HugeIcons.strokeRoundedPlane;

      case 'attach_money':
      case 'finance':
        return HugeIcons.strokeRoundedMoney01;

      // 🔲 Other/default: grid view instead of generic pin
      default:
        return HugeIcons.strokeRoundedGridView;
    }
  }
}
