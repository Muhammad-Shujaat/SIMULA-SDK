# simula_sdk

Simula SSP SDK for Flutter iOS and Android - Production-ready native advertising SDK

## Installation

Add to your `pubspec.yaml`:

```yaml
dependencies:
  simula_sdk: ^1.0.0
```

Then run:

```bash
flutter pub get
```

## Dependencies

This SDK uses:
- `webview_flutter` - For rendering ad HTML content
- `visibility_detector` - For impression tracking
- `dio` - For HTTP requests

## Quick Start

### 1. Provider Setup

Initialize the `SimulaManager` in your `main()`:

```dart
import 'package:simula_sdk/simula_manager.dart';

void main() {
  SimulaManager().initialize(apiKey: 'pub_a7f3c92d8b1e4f6fa2d4c1e9b73a5c4e');
  runApp(MyApp());
}
```

### 2. Widget Usage

Use the `NativeBanner` widget to display ads in your feed:

```dart
import 'package:simula_sdk/native_banner.dart';

class FeedScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Your content widgets
        NativeBanner(
          slot: 'explore',
          position: 0,
          width: double.infinity,
          height: 250,
          onError: (error) => print('Ad error: $error'),
          onImpression: () => print('Impression tracked!'),
        ),
        // More content
      ],
    );
  }
}
```

## API Reference

### SimulaManager

#### initialize

```dart
void initialize({required String apiKey})
```

Initialize the SDK with your API key.

**Parameters:**
- `apiKey` (String): Your Simula API key

#### fetchAd

```dart
Future<Map<String, dynamic>?> fetchAd({
  required String slot,
  required int position,
  CancelToken? cancelToken,
})
```

Fetch an ad by slot and position.

**Parameters:**
- `slot` (String): Ad slot identifier
- `position` (int): Ad position (0-indexed)
- `cancelToken` (CancelToken): Optional cancellation token

**Returns:** Map containing `adId`, `html`, and `height`

#### trackImpression

```dart
Future<void> trackImpression({required String adId})
```

Track an impression for the given ad ID.

**Parameters:**
- `adId` (String): The ad ID to track

### NativeBanner Widget

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slot | String | Yes | Ad slot identifier (e.g., "explore", "feed") |
| position | int | Yes | Ad position in slot (0-indexed) |
| width | double | Yes | Width of ad container (use `double.infinity` for full width) |
| height | double? | No | Fixed height for zero-flicker (recommended) |
| onError | Function(dynamic) | No | Error callback |
| onImpression | VoidCallback | No | Impression callback |

### Width Options

```dart
// Full width container
NativeBanner(
  slot: 'explore',
  position: 0,
  width: double.infinity,
  onImpression: () {},
)

// Fixed width
NativeBanner(
  slot: 'explore', 
  position: 0,
  width: 320,
  onImpression: () {},
)
```

## Features

### Zero-Flicker Loading
- Reserves container space before ad content arrives
- Uses VisibilityDetector for visibility detection
- Supports both fixed and default heights (250px)

### Caching
- Automatic caching by `slot:position` key
- Instant display on scroll-back (no network request)
- Session-scoped cache via SimulaManager singleton

### Impression Tracking
- Records impression when ad is ≥50% visible
- Requires continuous 1-second visibility
- Resets timer if ad scrolls out of view
- Uses VisibilityDetector with visibleFraction >= 0.5

### Lifecycle Management
- Cancels all pending requests on widget dispose
- Clears impression timers on dispose
- Proper cleanup via CancelToken

### Error Handling
- Never crashes the publisher's app
- Collapses ad container gracefully on errors
- Provides error callbacks for logging

## Architecture

```
simula_sdk/
├── lib/
│   ├── simula_sdk.dart      # Main exports
│   ├── simula_manager.dart  # Session & cache management
│   └── native_banner.dart   # Ad widget
└── pubspec.yaml
```

## Test API Key

```
pub_a7f3c92d8b1e4f6fa2d4c1e9b73a5c4e
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/session/create` | POST | Create session with API key |
| `/render_ad/ssp/native` | POST | Fetch ad HTML |
| `/track/engagement/impression/{ad_id}` | POST | Track impression |

Base URL: `https://simula-api-701226639755.us-central1.run.app`

## Testing

Test your SDK with the mock publisher app:
- Mobile: https://github.com/Simula-AI-SDK/flutter-mock-public

## Platform Setup

### iOS

Add to `ios/Runner/Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

### Android

No additional configuration required. Ensure you have internet permission in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

## Local Testing

Test with a local path:

```yaml
dependencies:
  simula_sdk:
    path: ../path/to/simula_sdk
```

## Requirements

- Flutter >= 3.0.0
- Dart >= 2.17.0
- iOS deployment target: 12.0+
- Android minSdk: 21+

## Example Project

Complete example with error handling:

```dart
import 'package:flutter/material.dart';
import 'package:simula_sdk/native_banner.dart';

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: Text('Simula SDK Demo')),
        body: SingleChildScrollView(
          child: Column(
            children: [
              // Content before ad
              ListTile(title: Text('Item 1')),
              ListTile(title: Text('Item 2')),
              
              // Native Banner Ad
              NativeBanner(
                slot: 'feed',
                position: 0,
                width: double.infinity,
                height: 250,
                onError: (error) {
                  print('Ad failed to load: $error');
                },
                onImpression: () {
                  print('Ad impression tracked!');
                },
              ),
              
              // More content
              ListTile(title: Text('Item 3')),
              ListTile(title: Text('Item 4')),
            ],
          ),
        ),
      ),
    );
  }
}
```

## License

MIT

