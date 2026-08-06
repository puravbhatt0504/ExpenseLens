import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../providers/providers.dart';
import 'package:dio/dio.dart';
import 'review_draft_screen.dart';

import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';

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
  final TextRecognizer _textRecognizer = TextRecognizer();
  bool _isProcessing = false;

  @override
  void dispose() {
    _textRecognizer.close();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(source: source);
      if (image == null) return; // User cancelled

      setState(() => _isProcessing = true);

      // Perform OCR locally using ML Kit
      final inputImage = InputImage.fromFilePath(image.path);
      final recognizedText = await _textRecognizer.processImage(inputImage);
      final text = recognizedText.text;

      // Debug: log the raw OCR output so we can diagnose parsing issues
      debugPrint('=== ML Kit OCR Output START ===');
      debugPrint(text);
      debugPrint('=== ML Kit OCR Output END ===');
      debugPrint('OCR text length: ${text.length} chars, ${text.split('\n').length} lines');

      // Send the extracted text to the backend for parsing
      final api = ref.read(apiClientProvider);
      final parsedData = await api.parseText(text);
      
      debugPrint('=== Parse Result ===');
      debugPrint('Amount: ${parsedData['amount']}');
      debugPrint('Merchant: ${parsedData['merchant']}');
      debugPrint('Category: ${parsedData['categoryId']}');
      debugPrint('Note: ${parsedData['note']}');

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
        String errMsg = e.toString();
        if (e is DioException && e.response?.data != null) {
          errMsg = e.response!.data.toString();
        } else if (e is DioException && e.response?.statusCode != null) {
          errMsg = 'Status Code: ${e.response?.statusCode}';
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to parse: $errMsg'),
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
      body: SafeArea(
        child: SingleChildScrollView(
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
