// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'savings_goal.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SavingsGoal _$SavingsGoalFromJson(Map<String, dynamic> json) => SavingsGoal(
  id: (json['id'] as num?)?.toInt(),
  name: json['name'] as String,
  targetAmount: (json['target_amount'] as num).toDouble(),
  currentAmount: (json['current_amount'] as num?)?.toDouble() ?? 0.0,
  targetDate: json['target_date'] as String?,
  icon: json['icon'] as String?,
  color: json['color'] as String?,
  createdAt: json['created_at'] as String?,
);

Map<String, dynamic> _$SavingsGoalToJson(SavingsGoal instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'target_amount': instance.targetAmount,
      'current_amount': instance.currentAmount,
      'target_date': instance.targetDate,
      'icon': instance.icon,
      'color': instance.color,
      'created_at': instance.createdAt,
    };
