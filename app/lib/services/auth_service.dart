import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../navigation.dart';

/// Owns the app's session: Google sign-in (used only once, to prove
/// identity at login) and the server-issued access/refresh token pair that
/// stands in for it afterwards.
///
/// [ApiClient]'s interceptors read [accessToken] and call [refresh] here;
/// this class is the only thing that talks to the `/auth/*` endpoints.
class AuthService {
  AuthService._internal();
  static final AuthService instance = AuthService._internal();
  factory AuthService() => instance;

  static const String _baseUrl = 'https://server-seven-gamma-95.vercel.app';

  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final Dio _authDio = Dio(
    BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ),
  );
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email'],
    serverClientId: '264648333363-2qmdh3i22gk2rhittp3cuitn06v21ev5.apps.googleusercontent.com',
  );

  String? _accessToken;
  DateTime? _accessExpiresAt;
  Future<bool>? _refreshFuture;

  String? get accessToken => _accessToken;

  bool get accessTokenExpiringSoon {
    if (_accessToken == null || _accessExpiresAt == null) return true;
    return DateTime.now().isAfter(_accessExpiresAt!.subtract(const Duration(seconds: 60)));
  }

  String get _device {
    try {
      return Platform.operatingSystem;
    } catch (_) {
      return 'flutter';
    }
  }

  Future<void> _persist({
    required String accessToken,
    required String refreshToken,
    required int expiresIn,
  }) async {
    _accessToken = accessToken;
    _accessExpiresAt = DateTime.now().add(Duration(seconds: expiresIn));
    await _storage.write(key: 'refresh_token', value: refreshToken);
    await _storage.write(key: 'access_token', value: accessToken);
    await _storage.write(key: 'access_expires_at', value: _accessExpiresAt!.toIso8601String());
  }

  Future<void> _loadFromStorage() async {
    _accessToken = await _storage.read(key: 'access_token');
    final expiresAtStr = await _storage.read(key: 'access_expires_at');
    _accessExpiresAt = expiresAtStr != null ? DateTime.tryParse(expiresAtStr) : null;
  }

  /// Runs the Google sign-in flow and exchanges the resulting ID token for
  /// our own session. Throws on cancellation or failure.
  Future<void> signInWithGoogle() async {
    final account = await _googleSignIn.signIn();
    if (account == null) {
      throw Exception('Sign-in cancelled');
    }
    final googleAuth = await account.authentication;
    final idToken = googleAuth.idToken;
    if (idToken == null) {
      throw Exception('Failed to get ID token from Google');
    }
    final response = await _authDio.post(
      '/auth/login',
      data: {'idToken': idToken, 'device': _device},
    );
    final data = response.data as Map<String, dynamic>;
    await _persist(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
      expiresIn: data['expiresIn'] as int,
    );
  }

  /// Attempts to refresh the session. Single-flighted: if a refresh is
  /// already in progress (e.g. five requests fired at once on dashboard
  /// load all found an expiring token), every caller shares that one
  /// network call instead of racing five separate refreshes.
  Future<bool> refresh() {
    return _refreshFuture ??= _doRefresh().whenComplete(() => _refreshFuture = null);
  }

  Future<bool> _doRefresh() async {
    final refreshToken = await _storage.read(key: 'refresh_token');
    if (refreshToken == null) return false;
    try {
      final response = await _authDio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken, 'device': _device},
      );
      final data = response.data as Map<String, dynamic>;
      await _persist(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
        expiresIn: data['expiresIn'] as int,
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Called once at splash/launch. Makes no network call unless a refresh
  /// token is actually present — in which case attempting a refresh both
  /// validates it (expired/revoked tokens fail here) and leaves the app
  /// holding a fresh access token, so this replaces the old check that
  /// only asked "does some token exist in storage" without checking it was
  /// still good.
  Future<bool> validateSessionOnLaunch() async {
    await _loadFromStorage();
    final refreshToken = await _storage.read(key: 'refresh_token');
    if (refreshToken == null) return false;
    return refresh();
  }

  /// Re-checked on every app resume — the case where the phone sat in a
  /// pocket long enough for the refresh token to expire or be revoked.
  Future<void> ensureValidSession() async {
    if (!accessTokenExpiringSoon) return;
    final ok = await refresh();
    if (!ok) {
      await forceLogout();
    }
  }

  /// User-initiated logout: revokes the refresh token server-side
  /// (best-effort) and clears local session state.
  Future<void> logout() async {
    final refreshToken = await _storage.read(key: 'refresh_token');
    if (refreshToken != null) {
      try {
        await _authDio.post('/auth/logout', data: {'refreshToken': refreshToken});
      } catch (_) {
        // Clear locally regardless of whether the revoke call succeeded.
      }
    }
    await _clearLocal();
  }

  /// The session could not be refreshed — expired, revoked, or reuse was
  /// detected. Clears everything and bounces to the login screen from
  /// wherever the app currently is, with a message explaining why.
  Future<void> forceLogout() async {
    await _clearLocal();
    rootNavigatorKey.currentState?.pushNamedAndRemoveUntil(
      '/login',
      (route) => false,
      arguments: const {'reason': 'expired'},
    );
  }

  Future<void> _clearLocal() async {
    _accessToken = null;
    _accessExpiresAt = null;
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
    await _storage.delete(key: 'access_expires_at');
    try {
      await _googleSignIn.signOut();
    } catch (_) {
      // Not signed in via Google in this session — nothing to do.
    }
    final prefs = await SharedPreferences.getInstance();
    for (final key in prefs.getKeys().where((k) => k.startsWith('cache_transactions_')).toList()) {
      await prefs.remove(key);
    }
  }
}
