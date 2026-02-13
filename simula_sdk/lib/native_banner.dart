import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:dio/dio.dart';
import 'simula_manager.dart';
import 'dart:async';

/// Default ad height for zero-flicker reservation
const double _defaultAdHeight = 250.0;
const double _minAdHeight = 130.0;
const double _minimumVisiblePercentage = 0.5;
const int _minimumVisibleDurationMs = 1000;

/// NativeBanner widget for displaying Simula ads
class NativeBanner extends StatefulWidget {
  /// The ad slot identifier
  final String slot;

  /// The position of this ad in the feed
  final int position;

  /// Width of the ad container (use double.infinity for fill, or specific value)
  final double width;

  /// Optional fixed height for the ad container
  final double? height;

  /// Callback when an error occurs
  final Function(dynamic error) onError;

  /// Callback when an impression is tracked
  final VoidCallback onImpression;

  /// Create a NativeBanner widget
  const NativeBanner({
    Key? key,
    required this.slot,
    required this.position,
    required this.width,
    this.height,
    required this.onError,
    required this.onImpression,
  }) : super(key: key);

  @override
  State<NativeBanner> createState() => _NativeBannerState();
}

class _NativeBannerState extends State<NativeBanner> {
  final SimulaManager _manager = SimulaManager();
  CancelToken? _currentCancelToken;
  
  String? _adId;
  String? _html;
  bool _loading = true;
  bool _error = false;
  bool _hasFetched = false;
  double _measuredHeight = 250.0;
  
  // Impression tracking state
  Timer? _impressionTimer;
  bool _impressionTracked = false;
  bool _isVisible = false;
  bool _disposed = false;

  // App lifecycle observer
  late final WidgetsBindingObserver _lifecycleObserver;

  @override
  void initState() {
    super.initState();
    _lifecycleObserver = _LifecycleObserver(onPause: _onAppPause, onResume: _onAppResume);
    WidgetsBinding.instance.addObserver(_lifecycleObserver);
    _fetchAd();
  }

  @override
  void dispose() {
    // Cancel all active network requests
    _disposed = true;
    _cancelCurrentFetch();
    _clearImpressionTimer();
    WidgetsBinding.instance.removeObserver(_lifecycleObserver);
    super.dispose();
  }

  Future<void> _fetchAd() async {
    if (_hasFetched || _manager.sessionId == null) return;
    _hasFetched = true;

    // Check cache first - return instantly if cached
    final cacheKey = '${widget.slot}:${widget.position}';
    if (_manager.cache.containsKey(cacheKey)) {
      final cached = _manager.cache[cacheKey] as Map<String, dynamic>;
      if (mounted) {
        setState(() {
          _adId = cached['adId'] as String?;
          _html = cached['html'] as String?;
          _measuredHeight = (cached['height'] as double?) ?? _defaultAdHeight;
          _loading = false;
        });
      }
      return;
    }

    try {
      _cancelCurrentFetch();
      _currentCancelToken = CancelToken();

      final adData = await _manager.fetchAd(
        slot: widget.slot,
        position: widget.position,
        cancelToken: _currentCancelToken,
      );

      if (adData != null && mounted) {
        setState(() {
          _adId = adData['adId'] as String?;
          _html = adData['html'] as String?;
          _measuredHeight = (adData['height'] as double?) ?? _defaultAdHeight;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        // If fetch was cancelled, allow retry later
        if (e is DioError && e.type == DioErrorType.cancel) {
          _hasFetched = false;
          return;
        }
        setState(() {
          _error = true;
          _loading = false;
        });
        widget.onError(e);
      }
    }
  }

  void _cancelCurrentFetch() {
    if (_currentCancelToken != null && !_currentCancelToken!.isCancelled) {
      _currentCancelToken!.cancel('Visibility changed or disposed');
      _currentCancelToken = null;
    }
  }

  void _clearImpressionTimer() {
    if (_impressionTimer != null && _impressionTimer!.isActive) {
      _impressionTimer!.cancel();
      _impressionTimer = null;
    }
  }

  void _onVisibilityChanged(VisibilityInfo info) {
    final visibleFraction = info.visibleFraction;
    final wasVisible = _isVisible;
    _isVisible = visibleFraction >= _minimumVisiblePercentage;

    if (_isVisible && _adId != null) {
      // Start a one-shot timer that fires only if visibility remains for the duration
      if (_impressionTracked) return;
      _clearImpressionTimer();
      _impressionTimer = Timer(Duration(milliseconds: _minimumVisibleDurationMs), () async {
        if (_isVisible && !_impressionTracked && _adId != null) {
          _impressionTracked = true;
          // optimistic UI callback
          try {
            widget.onImpression();
          } catch (_) {}
          // Fire network tracking (don't block UI)
          try {
            await _manager.trackImpression(adId: _adId!);
          } catch (e) {
            // On tracking failure, collapse ad gracefully
            if (mounted) {
              setState(() {
                _error = true;
              });
            }
          }
        }
      });
    } else {
      // Reset impression state when ad scrolls out of view; cancel impression timer
      if (wasVisible && !_isVisible) {
        _clearImpressionTimer();
        _impressionTracked = false;
      }

      // Cancel any active ad fetch when scrolled out of view and allow retry
      if (_currentCancelToken != null) {
        _cancelCurrentFetch();
        _hasFetched = false;
      }
    }
  }

  Future<void> _trackImpression() async {
    if (_adId == null || _impressionTracked) return;
    
    try {
      await _manager.trackImpression(adId: _adId!);
      if (mounted) {
        widget.onImpression();
      }
    } catch (e) {
      print('Failed to track impression: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    // Error state: collapse ad container gracefully
    if (_error) {
      return const SizedBox.shrink();
    }

    // Calculate height for zero-flicker reservation
    final reservedHeight = _html != null ? _measuredHeight : (widget.height ?? _defaultAdHeight);

    return VisibilityDetector(
      key: Key('native_banner_${widget.slot}_${widget.position}'),
      onVisibilityChanged: _onVisibilityChanged,
      child: SizedBox(
        width: widget.width,
        height: reservedHeight.clamp(_minAdHeight, double.infinity),
        child: _loading
            ? const Center(
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                  ),
                ),
              )
            : _buildAdContent(),
      ),
    );
  }

  Widget _buildAdContent() {
    if (_html == null || _html!.isEmpty) {
      return const SizedBox.shrink();
    }

    return WebView(
      javascriptMode: JavascriptMode.unrestricted,
      initialUrl: Uri.dataFromString(
        _html!,
        mimeType: 'text/html',
      ).toString(),
      onWebViewCreated: (controller) {
        // WebView created
      },
      onPageFinished: (url) {
        // Could measure height here if needed
      },
    );
  }
}

class _LifecycleObserver extends WidgetsBindingObserver {
  final VoidCallback onPause;
  final VoidCallback onResume;

  _LifecycleObserver({required this.onPause, required this.onResume});

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      onPause();
    } else if (state == AppLifecycleState.resumed) {
      onResume();
    }
  }
}

extension on _NativeBannerState {
  void _onAppPause() {
    // clear timers and cancel fetches when app goes to background
    _clearImpressionTimer();
    _cancelCurrentFetch();
  }

  void _onAppResume() {
    // no-op for now; allow visibility to trigger fetch again
  }
}

