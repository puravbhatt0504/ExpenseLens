import 'package:flutter/material.dart';

/// App-wide navigator key so code outside the widget tree (namely
/// [AuthService] forcing a logout from a Dio interceptor) can navigate to
/// the login screen without needing a [BuildContext].
final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();
