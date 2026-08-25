import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:dio/dio.dart';
import '../main.dart';
import '../providers/providers.dart';
import '../theme/app_theme.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  bool _isLoading = false;
  bool _shownExpiredMessage = false;

  Future<void> _handleSignIn() async {
    if (_isLoading) return;
    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.loginWithGoogle();

      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const AppShell()),
      );
    } catch (error) {
      if (!mounted) return;
      String errMsg = error.toString();
      if (error is DioException && error.response?.data != null) {
        errMsg = error.response!.data.toString();
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Login failed: $errMsg')),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments;
    if (!_shownExpiredMessage && args is Map && args['reason'] == 'expired') {
      _shownExpiredMessage = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Your session expired — please sign in again.')),
        );
      });
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Logo
              Image.asset(
                'assets/images/logo.png',
                height: 120,
                errorBuilder: (ctx, err, stack) => const Icon(
                  Icons.account_balance_wallet,
                  size: 100,
                  color: AppTheme.primary,
                ),
              ).animate().fade(duration: 500.ms).scale(delay: 100.ms),
              const SizedBox(height: 40),

              // Welcome Text
              Text(
                'Welcome Back',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ).animate().fade(delay: 200.ms).slideY(begin: 0.2, end: 0),
              const SizedBox(height: 16),
              Text(
                'Sign in to sync your expenses across all your devices securely.',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.textSecondary,
                  height: 1.5,
                ),
              ).animate().fade(delay: 300.ms).slideY(begin: 0.2, end: 0),
              const SizedBox(height: 60),

              // Google Login Button
              if (_isLoading)
                const Center(child: CircularProgressIndicator())
              else
                InkWell(
                  onTap: _handleSignIn,
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: AppTheme.cardColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.g_mobiledata, size: 32, color: AppTheme.primary),
                        const SizedBox(width: 8),
                        Text(
                          'Continue with Google',
                          style: GoogleFonts.roboto(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: Colors.black87,
                          ),
                        ),
                      ],
                    ),
                  ),
                ).animate().fade(delay: 400.ms).slideY(begin: 0.2, end: 0),
            ],
          ),
        ),
      ),
    );
  }
}
