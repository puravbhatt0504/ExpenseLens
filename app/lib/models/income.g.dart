// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'income.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Income _$IncomeFromJson(Map<String, dynamic> json) => Income(
  id: (json['id'] as num?)?.toInt(),
  amount: (json['amount'] as num).toDouble(),
  date: json['date'] as String,
  source: json['source'] as String?,
  note: json['note'] as String?,
  paymentMethod: json['payment_method'] as String?,
  createdAt: json['created_at'] as String?,
);

Map<String, dynamic> _$IncomeToJson(Income instance) => <String, dynamic>{
  'id': instance.id,
  'amount': instance.amount,
  'date': instance.date,
  'source': instance.source,
  'note': instance.note,
  'payment_method': instance.paymentMethod,
  'created_at': instance.createdAt,
};
