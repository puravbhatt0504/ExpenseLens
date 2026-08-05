// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transaction.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Transaction _$TransactionFromJson(Map<String, dynamic> json) => Transaction(
  id: (json['id'] as num?)?.toInt(),
  amount: (json['amount'] as num).toDouble(),
  txnDate: json['txn_date'] as String,
  merchant: json['merchant'] as String?,
  note: json['note'] as String?,
  categoryId: (json['category_id'] as num?)?.toInt(),
  source: json['source'] as String,
  rawExtracted: json['raw_extracted'] as Map<String, dynamic>?,
  createdAt: json['created_at'] as String?,
  categoryName: json['category_name'] as String?,
  categoryIcon: json['category_icon'] as String?,
  categoryColor: json['category_color'] as String?,
  paymentMethod: json['payment_method'] as String?,
);

Map<String, dynamic> _$TransactionToJson(Transaction instance) =>
    <String, dynamic>{
      'id': instance.id,
      'amount': instance.amount,
      'txn_date': instance.txnDate,
      'merchant': instance.merchant,
      'note': instance.note,
      'category_id': instance.categoryId,
      'source': instance.source,
      'raw_extracted': instance.rawExtracted,
      'created_at': instance.createdAt,
      'payment_method': instance.paymentMethod,
      'category_name': instance.categoryName,
      'category_icon': instance.categoryIcon,
      'category_color': instance.categoryColor,
    };
