import 'package:dio/dio.dart';

/// Simula SDK Manager - Singleton class for session management and API coordination
class SimulaManager {
  static final SimulaManager _instance = SimulaManager._internal();
  factory SimulaManager() => _instance;

  SimulaManager._internal();

  static const String _baseUrl = 'https://simula-api-701226639755.us-central1.run.app';

  String? _apiKey;
  String? _sessionId;
  final Map<String, dynamic> _cache = {};
  bool _mockAds = false;

  /// Initialize the SDK with API key
  void initialize({required String apiKey, bool mockAds = false}) {
    _apiKey = apiKey;
    _mockAds = mockAds;
    _createSession();
  }

  /// Create a new session with the Simula API
  Future<void> _createSession() async {
    if (_apiKey == null) return;

    try {
      final dio = Dio();
      final response = await dio.post(
        '$_baseUrl/session/create',
        options: Options(
          headers: {
            'Authorization': 'Bearer $_apiKey',
            'Content-Type': 'application/json',
          },
        ),
        data: {},
      );
      if (response.data != null && response.data['sessionId'] != null) {
        _sessionId = response.data['sessionId'] as String;
      }
    } catch (e) {
      print('Failed to create session: $e');
    }
  }

  /// Get the current session ID
  String? get sessionId => _sessionId;

  /// Get the API key
  String? get apiKey => _apiKey;

  /// Get the ad cache
  Map<String, dynamic> get cache => _cache;

  /// Fetch an ad from the cache or API
  Future<Map<String, dynamic>?> fetchAd({
    required String slot,
    required int position,
    CancelToken? cancelToken,
  }) async {
    if (_sessionId == null) return null;

    final cacheKey = '$slot:$position';

    // Return cached ad if available
    if (_cache.containsKey(cacheKey)) {
      return _cache[cacheKey] as Map<String, dynamic>;
    }

    try {
      // If mock mode is enabled, return a generated image-based ad
      if (_mockAds) {
        // allow cancellation
        final completer = Completer<Map<String, dynamic>>();
        // simulate network latency
        Future.delayed(Duration(milliseconds: 250 + (position * 120))).then((_) {
          if (cancelToken != null && cancelToken.isCancelled) {
            completer.completeError(DioError(requestOptions: RequestOptions(path: ''), type: DioErrorType.cancel));
            return;
          }
          final aid = 'mock-aid-$slot-$position';
          final html = '<div style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;">'
              '<a href="#" style="display:block;text-decoration:none;color:inherit">'
              '<img src="https://picsum.photos/seed/${Uri.encodeComponent(aid)}/600/200" ' 
              'style="width:100%;height:auto;display:block;border-radius:6px" alt="Mock Ad"/>'
              '<div style="padding:8px; font-size:14px; color:#333;">Sponsored content — $aid</div>'
              '</a></div>';

          final adData = {
            'adId': aid,
            'html': html,
            'height': 200.0,
          };
          _cache[cacheKey] = adData;
          completer.complete(adData);
        });

        return completer.future;
      }

      final dio = Dio();
      final response = await dio.post(
        '$_baseUrl/render_ad/ssp/native',
        cancelToken: cancelToken,
        options: Options(
          headers: {
            'Authorization': 'Bearer $_apiKey',
            'Content-Type': 'application/json',
          },
        ),
        data: {
          'session_id': _sessionId,
          'slot': slot,
          'position': position,
        },
      );

      // Extract aid from headers
      final aid = response.headers['aid']?.first as String?;
      final html = response.data as String;

      final adData = {
        'adId': aid,
        'html': html,
        'height': 250.0, // Default height
      };

      // Cache the ad
      _cache[cacheKey] = adData;

      return adData;
    } catch (e) {
      print('Failed to fetch ad: $e');
      rethrow;
    }
  }

  /// Track an impression for the given ad ID
  Future<void> trackImpression({required String adId}) async {
    if (_apiKey == null) return;

    try {
      final dio = Dio();
      await dio.post(
        '$_baseUrl/track/engagement/impression/$adId',
        options: Options(
          headers: {
            'Authorization': 'Bearer $_apiKey',
            'Content-Type': 'application/json',
          },
        ),
        data: {},
      );
    } catch (e) {
      print('Failed to track impression: $e');
    }
  }

  /// Clear the cache
  void clearCache() {
    _cache.clear();
  }
}

