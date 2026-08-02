import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../providers/providers.dart';
import 'review_draft_screen.dart';

/// Screenshot Upload screen — pick a UPI/PhonePe screenshot for parsing.
class ScreenshotUploadScreen extends ConsumerStatefulWidget {
  const ScreenshotUploadScreen({super.key});

  @override
  ConsumerState<ScreenshotUploadScreen> createState() =>
      _ScreenshotUploadScreenState();
}

class _ScreenshotUploadScreenState
    extends ConsumerState<ScreenshotUploadScreen> {
  final ImagePicker _picker = ImagePicker();
  bool _isProcessing = false;

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(source: source);
      if (image == null) return; // User cancelled

      setState(() => _isProcessing = true);

      final api = ref.read(apiClientProvider);
      final parsedData = await api.parseReceipt(image.path);

      if (mounted) {
        // Navigate to the Review Draft screen with parsed data
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => ReviewDraftScreen(parsedData: parsedData),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to parse screenshot. Falling back to manual entry.'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
        // Fallback to manual entry
        Navigator.pushReplacementNamed(context, '/add-transaction');
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Upload Screenshot'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_isProcessing) ...[
                const CircularProgressIndicator(),
                const SizedBox(height: 24),
                Text(
                  'The Lens is analyzing your receipt...',
                  style: theme.textTheme.titleMedium,
                ),
              ] else ...[
                Icon(Icons.camera_alt_outlined,
                    size: 64, color: theme.colorScheme.primary),
                const SizedBox(height: 24),
                Text(
                  'Auto-Parse Transactions',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Upload a screenshot of your UPI or PhonePe payment to automatically extract the amount, merchant, and category.',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.outline,
                  ),
                ),
                const SizedBox(height: 48),
                FilledButton.icon(
                  onPressed: () => _pickImage(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library),
                  label: const Text('Choose from Gallery'),
                  style: FilledButton.styleFrom(
                    minimumSize: const Size(double.infinity, 56),
                  ),
                ),
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  onPressed: () => _pickImage(ImageSource.camera),
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('Take Photo'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 56),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
