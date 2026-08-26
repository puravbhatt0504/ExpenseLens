import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'screens/dashboard_screen.dart';
import 'screens/add_transaction_screen.dart';
import 'screens/transaction_list_screen.dart';
import 'screens/screenshot_upload_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/login_screen.dart';
import 'screens/income_screen.dart';
import 'screens/savings_screen.dart';
import 'theme/app_theme.dart';
import 'navigation.dart';
import 'services/auth_service.dart';

import 'screens/budget_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // The app targets SDK 36, and since Android 15 edge-to-edge is enforced —
  // the app always draws behind the status and navigation bars, and the old
  // opt-out flag no longer exists. That makes the *icon* brightness our
  // responsibility: on a 3-button device the back/home/recents glyphs are
  // drawn by the system over whatever we render underneath, so without this
  // they can come out light-on-light against our light theme and effectively
  // disappear. Transparent bars let NavigationBar's own surface show through.
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    statusBarBrightness: Brightness.light, // iOS
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarIconBrightness: Brightness.dark,
    systemNavigationBarContrastEnforced: false,
  ));

  runApp(const ProviderScope(child: ExpenseLensApp()));
}

class ExpenseLensApp extends StatelessWidget {
  const ExpenseLensApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ExpenseLens',
      navigatorKey: rootNavigatorKey,
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: const SplashScreen(),
      routes: {
        '/add-transaction': (context) => const AddTransactionScreen(),
        '/screenshot-upload': (context) => const ScreenshotUploadScreen(),
        '/login': (context) => const LoginScreen(),
        '/budget': (context) => const BudgetScreen(),
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

    // Validates the session, not just "is some token present" — a refresh
    // token that has since expired or been revoked correctly sends the
    // user back to login instead of into a dashboard full of 401s.
    final hasValidSession = await AuthService().validateSessionOnLaunch();

    if (!mounted) return;

    Widget nextScreen;
    if (!hasSeenOnboarding) {
      nextScreen = const OnboardingScreen();
    } else if (!hasValidSession) {
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

class _AppShellState extends State<AppShell> with WidgetsBindingObserver {
  int _currentIndex = 0;

  final GlobalKey<IncomeScreenState> _incomeKey = GlobalKey();
  final GlobalKey<SavingsScreenState> _savingsKey = GlobalKey();

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _screens = [
      const DashboardScreen(),
      IncomeScreen(key: _incomeKey),
      const TransactionListScreen(),
      SavingsScreen(key: _savingsKey),
    ];
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Catches the phone-sat-in-a-pocket-overnight case: the access token
    // (and possibly the refresh token) may have gone stale while the app
    // was backgrounded.
    if (state == AppLifecycleState.resumed) {
      AuthService().ensureValidSession();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      // No SafeArea here on purpose. Material 3's NavigationBar already reads
      // the bottom system inset and extends its own surface behind the system
      // navigation bar, padding its icons up out of the way. Wrapping it in a
      // SafeArea instead strips that inset from the child and re-adds it as
      // *external* padding, so the bar floats above the system buttons with a
      // band of bare Scaffold background showing underneath — ~24dp on gesture
      // navigation (easy to miss) but ~48dp on 3-button navigation, where it
      // reads as an obvious dead stripe and eats usable height.
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
            icon: Icon(Icons.trending_up_outlined),
            selectedIcon: Icon(Icons.trending_up),
            label: 'Income',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: 'Expenses',
          ),
          NavigationDestination(
            icon: Icon(Icons.savings_outlined),
            selectedIcon: Icon(Icons.savings),
            label: 'Savings',
          ),
        ],
      ),
      floatingActionButton: _buildFab(),
    );
  }

  Widget? _buildFab() {
    if (_currentIndex == 2) {
      return FloatingActionButton(
        onPressed: () => _showAddOptions(context),
        child: const Icon(Icons.add),
      );
    } else if (_currentIndex == 1) {
      return FloatingActionButton.extended(
        onPressed: () => _incomeKey.currentState?.showAddIncomeModal(),
        icon: const Icon(Icons.add),
        label: const Text('Add Income'),
      );
    } else if (_currentIndex == 3) {
      return FloatingActionButton.extended(
        onPressed: () => _savingsKey.currentState?.showAddGoalModal(),
        icon: const Icon(Icons.add),
        label: const Text('New Goal'),
      );
    }
    return null;
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
