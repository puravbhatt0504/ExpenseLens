import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'screens/dashboard_screen.dart';
import 'screens/add_transaction_screen.dart';
import 'screens/transaction_list_screen.dart';
import 'screens/screenshot_upload_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/login_screen.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(
    child: ExpenseLensApp(),
  ));
}

class ExpenseLensApp extends StatelessWidget {
  const ExpenseLensApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ExpenseLens',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const SplashScreen(),
      routes: {
        '/add-transaction': (context) => const AddTransactionScreen(),
        '/screenshot-upload': (context) => const ScreenshotUploadScreen(),
        '/login': (context) => const LoginScreen(),
      },
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    final prefs = await SharedPreferences.getInstance();
    final hasSeenOnboarding = prefs.getBool('has_seen_onboarding') ?? false;

    const storage = FlutterSecureStorage();
    final hasAuthToken = await storage.containsKey(key: 'auth_token');

    if (!mounted) return;

    Widget nextScreen;
    if (!hasSeenOnboarding) {
      nextScreen = const OnboardingScreen();
    } else if (!hasAuthToken) {
      nextScreen = const LoginScreen();
    } else {
      nextScreen = const AppShell();
    }

    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => nextScreen,
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
        transitionDuration: const Duration(milliseconds: 300),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // A highly optimized, lightweight splash screen
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Image.asset(
          'assets/images/logo.png',
          width: 150,
          height: 150,
        ),
      ),
    );
  }
}

/// App shell with bottom navigation between Dashboard and Transaction List.
class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    DashboardScreen(),
    TransactionListScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() => _currentIndex = index);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: 'Transactions',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          _showAddOptions(context);
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showAddOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('Add Manually'),
              subtitle: const Text('Enter transaction details by hand'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/add-transaction');
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Upload Screenshot'),
              subtitle: const Text('Parse a UPI/PhonePe screenshot'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/screenshot-upload');
              },
            ),
          ],
        ),
      ),
    );
  }
}
