import 'package:json_annotation/json_annotation.dart';

part 'category.g.dart';

@JsonSerializable()
class Category {
  final int id;
  final String name;
  @JsonKey(name: 'category_group')
  final String? categoryGroup;
  final String? icon;
  final String? color;

  Category({
    required this.id,
    required this.name,
    this.categoryGroup,
    this.icon,
    this.color,
  });

  factory Category.fromJson(Map<String, dynamic> json) =>
      _$CategoryFromJson(json);

  Map<String, dynamic> toJson() => _$CategoryToJson(this);

  @override
  String toString() => 'Category(id: $id, name: $name, group: $categoryGroup)';
}
