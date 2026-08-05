import 'package:json_annotation/json_annotation.dart';

part 'savings_goal.g.dart';

@JsonSerializable()
class SavingsGoal {
  final int? id;
  final String name;
  
  @JsonKey(name: 'target_amount')
  final double targetAmount;
  
  @JsonKey(name: 'current_amount')
  final double currentAmount;
  
  @JsonKey(name: 'target_date')
  final String? targetDate;
  
  final String? icon;
  final String? color;

  @JsonKey(name: 'created_at')
  final String? createdAt;

  SavingsGoal({
    this.id,
    required this.name,
    required this.targetAmount,
    this.currentAmount = 0.0,
    this.targetDate,
    this.icon,
    this.color,
    this.createdAt,
  });

  factory SavingsGoal.fromJson(Map<String, dynamic> json) => _$SavingsGoalFromJson(json);
  Map<String, dynamic> toJson() => _$SavingsGoalToJson(this);
}
