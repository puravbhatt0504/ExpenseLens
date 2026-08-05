// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'summary.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CategorySpend _$CategorySpendFromJson(Map<String, dynamic> json) =>
    CategorySpend(
      categoryId: (json['categoryId'] as num?)?.toInt(),
      categoryName: json['categoryName'] as String,
      categoryIcon: json['categoryIcon'] as String,
      categoryColor: json['categoryColor'] as String,
      amount: (json['amount'] as num).toDouble(),
      budget: (json['budget'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$CategorySpendToJson(CategorySpend instance) =>
    <String, dynamic>{
      'categoryId': instance.categoryId,
      'categoryName': instance.categoryName,
      'categoryIcon': instance.categoryIcon,
      'categoryColor': instance.categoryColor,
      'amount': instance.amount,
      'budget': instance.budget,
    };

Summary _$SummaryFromJson(Map<String, dynamic> json) => Summary(
  month: json['month'] as String,
  count: (json['count'] as num).toInt(),
  total: (json['total'] as num).toDouble(),
  totalIncome: (json['totalIncome'] as num?)?.toDouble() ?? 0.0,
  totalBudget: (json['totalBudget'] as num?)?.toDouble(),
  byCategory: (json['byCategory'] as List<dynamic>)
      .map((e) => CategorySpend.fromJson(e as Map<String, dynamic>))
      .toList(),
);

Map<String, dynamic> _$SummaryToJson(Summary instance) => <String, dynamic>{
  'month': instance.month,
  'count': instance.count,
  'total': instance.total,
  'totalIncome': instance.totalIncome,
  'totalBudget': instance.totalBudget,
  'byCategory': instance.byCategory,
};
