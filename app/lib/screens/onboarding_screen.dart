import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';

/// Colorful, graphical onboarding flow.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  bool _isLastPage = false;

  final List<OnboardingSlide> _slides = [
    OnboardingSlide(
      title: 'Welcome to ExpenseLens',
      description: 'Your intelligent sidekick for seamless budget management and financial goal tracking.',
      imagePath: 'assets/images/logo.png',
      color: AppTheme.primary,
    ),
    OnboardingSlide(
      title: 'Auto-Extract Magic',
      description: 'Upload UPI screenshots, and we automatically parse the amount, merchant, and category for you.',
      icon: Icons.auto_awesome,
      color: AppTheme.secondary,
    ),
    OnboardingSlide(
      title: 'Visualize Your Spending',
      description: 'View beautiful, colorful pie charts to instantly understand where your money goes.',
      icon: Icons.pie_chart,
      color: const Color(0xFF00B894),
    ),
  ];

  Future<void> _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('has_seen_onboarding', true);

    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        padding: const EdgeInsets.only(bottom: 80),
        child: PageView.builder(
          controller: _pageController,
          onPageChanged: (index) {
            setState(() => _isLastPage = index == _slides.length - 1);
          },
          itemCount: _slides.length,
          itemBuilder: (context, index) {
            final slide = _slides[index];
            return RepaintBoundary(
              child: Container(
                color: slide.color,
                padding: const EdgeInsets.all(40),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (slide.imagePath != null)
                      Image.asset(
                        slide.imagePath!,
                        height: 250,
                        errorBuilder: (ctx, err, stack) => const Icon(
                          Icons.account_balance_wallet,
                          size: 150,
                          color: Colors.white,
                        ),
                      ).animate().fade(duration: 400.ms).scale(duration: 400.ms)
                    else
                      Icon(
                        slide.icon,
                        size: 180,
                        color: Colors.white,
                      ).animate().fade(duration: 400.ms).scale(duration: 400.ms),
                    const SizedBox(height: 60),
                    Text(
                      slide.title,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        height: 1.2,
                      ),
                    ).animate().fade(delay: 100.ms, duration: 400.ms),
                    const SizedBox(height: 20),
                    Text(
                      slide.description,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        color: Colors.white.withOpacity(0.9),
                        height: 1.5,
                      ),
                    ).animate().fade(delay: 200.ms, duration: 400.ms),
                  ],
                ),
              ),
            );
          },
        ),
      ),
      bottomSheet: Container(
        color: _isLastPage ? _slides.last.color : _slides[_pageController.hasClients && _pageController.page != null ? _pageController.page!.round() : 0].color,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                SmoothPageIndicator(
                  controller: _pageController,
                  count: _slides.length,
                  effect: const ExpandingDotsEffect(
                    activeDotColor: Colors.white,
                    dotColor: Colors.white54,
                    dotHeight: 8,
                    dotWidth: 8,
                  ),
                ),
                InkWell(
                  onTap: () {
                    if (_isLastPage) {
                      _completeOnboarding();
                    } else {
                      _pageController.nextPage(
                        duration: const Duration(milliseconds: 500),
                        curve: Curves.easeInOut,
                      );
                    }
                  },
                  borderRadius: BorderRadius.circular(30),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Text(
                      _isLastPage ? 'Get Started' : 'Next',
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: _isLastPage ? _slides.last.color : AppTheme.primary,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class OnboardingSlide {
  final String title;
  final String description;
  final String? imagePath;
  final IconData? icon;
  final Color color;

  OnboardingSlide({
    required this.title,
    required this.description,
    this.imagePath,
    this.icon,
    required this.color,
  });
}
