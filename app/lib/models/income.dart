import 'package:json_annotation/json_annotation.dart';

part 'income.g.dart';

@JsonSerializable()
class Income {
  final int? id;
  final double amount;
  
  final String date;
  
  final String? source;
  final String? note;
  
  @JsonKey(name: 'payment_method')
  final String? paymentMethod;

  @JsonKey(name: 'created_at')
  final String? createdAt;

  Income({
    this.id,
    required this.amount,
    required this.date,
    this.source,
    this.note,
    this.paymentMethod,
    this.createdAt,
  });

  factory Income.fromJson(Map<String, dynamic> json) => _$IncomeFromJson(json);
  Map<String, dynamic> toJson() => _$IncomeToJson(this);
}
