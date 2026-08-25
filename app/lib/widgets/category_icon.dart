import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../utils/category_icons.dart';
import '../utils/circum_icons.dart';

/// Renders a category's icon from its `icon` key, in full colour.
///
/// Resolution order:
///   1. `el:*` — the current bundled flat-colour artwork (see
///      `category_icons.dart`, generated from `server/icons/manifest.json`).
///   2. `circum:*` — the old monochrome outline set. Kept only so a device
///      that cached categories before migration 018 shipped doesn't render
///      blank icons until its next refresh; tinted with [legacyColor] since
///      those SVGs have no colour of their own.
///   3. A short raw string — treated as a literal emoji character.
///   4. Anything else — falls back to the generic "Miscellaneous" icon.
class CategoryIconView extends StatelessWidget {
  final String? iconKey;
  final double size;
  final Color? legacyColor;

  const CategoryIconView({
    super.key,
    required this.iconKey,
    this.size = 24,
    this.legacyColor,
  });

  @override
  Widget build(BuildContext context) {
    final key = iconKey;

    if (key != null && key.startsWith('el:') && categoryIcons.containsKey(key)) {
      return SvgPicture.string(categoryIcons[key]!, width: size, height: size);
    }

    if (key != null && key.startsWith('circum:') && circumIcons.containsKey(key)) {
      return SvgPicture.string(
        circumIcons[key]!,
        width: size,
        height: size,
        colorFilter: ColorFilter.mode(legacyColor ?? Colors.black54, BlendMode.srcIn),
      );
    }

    if (key != null && key.isNotEmpty && key.runes.length <= 3) {
      return Text(key, style: TextStyle(fontSize: size * 0.85));
    }

    return SvgPicture.string(categoryIcons['el:misc']!, width: size, height: size);
  }
}
