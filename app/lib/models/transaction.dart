import 'package:json_annotation/json_annotation.dart';

part 'transaction.g.dart';

@JsonSerializable()
class Transaction {
  final int? id;
  final double amount;

  @JsonKey(name: 'txn_date')
  final String txnDate;

  final String? merchant;
  final String? note;

  @JsonKey(name: 'category_id')
  final int? categoryId;

  final String source;

  @JsonKey(name: 'raw_extracted')
  final Map<String, dynamic>? rawExtracted;

  @JsonKey(name: 'created_at')
  final String? createdAt;

  @JsonKey(name: 'payment_method')
  final String? paymentMethod;

  // Joined fields from GET /transactions
  @JsonKey(name: 'category_name')
  final String? categoryName;

  @JsonKey(name: 'category_icon')
  final String? categoryIcon;

  @JsonKey(name: 'category_color')
  final String? categoryColor;

  Transaction({
    this.id,
    required this.amount,
    required this.txnDate,
    this.merchant,
    this.note,
    this.categoryId,
    required this.source,
    this.rawExtracted,
    this.createdAt,
    this.categoryName,
    this.categoryIcon,
    this.categoryColor,
    this.paymentMethod,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) =>
      _$TransactionFromJson(json);

  Map<String, dynamic> toJson() => _$TransactionToJson(this);

  @override
  String toString() =>
      'Transaction(id: $id, amount: $amount, merchant: $merchant)';
}
