import 'package:json_annotation/json_annotation.dart';

part 'summary.g.dart';

@JsonSerializable()
class CategorySpend {
  final int? categoryId;
  final String categoryName;
  final String categoryIcon;
  final String categoryColor;
  final double amount;

  CategorySpend({
    this.categoryId,
    required this.categoryName,
    required this.categoryIcon,
    required this.categoryColor,
    required this.amount,
  });

  factory CategorySpend.fromJson(Map<String, dynamic> json) =>
      _$CategorySpendFromJson(json);

  Map<String, dynamic> toJson() => _$CategorySpendToJson(this);
}

@JsonSerializable()
class Summary {
  final String month;
  final int count;
  final double total;
  final List<CategorySpend> byCategory;

  Summary({
    required this.month,
    required this.count,
    required this.total,
    required this.byCategory,
  });

  factory Summary.fromJson(Map<String, dynamic> json) =>
      _$SummaryFromJson(json);

  Map<String, dynamic> toJson() => _$SummaryToJson(this);
}
