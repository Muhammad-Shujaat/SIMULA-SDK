## Simula SSP SDK

Simula SSP SDK — React (Web) + Flutter (iOS/Android)

This repository contains two SDKs implementing a production-ready native banner ad component with strict requirements:

- Zero-flicker loading (reserve layout space)
- In-memory caching (no duplicate network requests per session)
- Impression tracking: >=50% visible for continuous 1s
- Lifecycle management: cancel network calls when out of view and clear timers on background/unload
- Flexible widths (px, %, fill-container)
- Graceful loading and error states

Contents
- `react-sdk/` — TypeScript React SDK and a `test.html` demo for manual testing
- `simula_sdk/` — Flutter SDK (Dart) with `NativeBanner` and `SimulaManager`

Quick start (local testing)

1) Serve the React demo

```bash
cd "react-sdk"
# start a simple static server (python)
python3 -m http.server 8000
# open http://localhost:8000/test.html in a browser
```

2) Enable mock ads in Flutter (for local dev)

In your Flutter app, initialize the SDK with mocks enabled:

```dart
SimulaManager().initialize(apiKey: 'pub_a7f3c92d8b1e4f6fa2d4c1e9b73a5c4e', mockAds: true);
```

Behavior highlights
- Zero-flicker: Components reserve a minimum height before ad HTML loads.
- Caching: Ads are cached in-memory for the session — scrolling back shows cached ad instantly.
- Impression: Tracked only after the ad is >=50% visible for 1 continuous second. Timer resets if visibility drops.
- Lifecycle: Active network requests are canceled when an ad is scrolled out of view or when page/app backgrounded.
- Flexible widths: `NativeBanner` supports pixel values, percentages, and fill (100%/double.infinity).

Testing
- `react-sdk/scripts/headless-test.js` — headless smoke test (requires `puppeteer`).
- Manual test: open `react-sdk/test.html`, open DevTools network panel and observe `/render_ad/ssp/native` and `/track/engagement/impression`.

API key (test)
Use the provided public test key for local testing:

```
SIMULA_API_KEY=pub_a7f3c92d8b1e4f6fa2d4c1e9b73a5c4e
```

Publishing notes
- React: package.json present in `react-sdk`. Run `npm run build` then publish or `npm link` for local testing.
- Flutter: `simula_sdk/pubspec.yaml` ready for local path dependency testing.

Demo
- Demo video link (recording): https://drive.google.com/file/d/1BisDMA3qrP1LPwjP13AJ8ljR4XXqu_jc/view?usp=drive_link

License
- MIT

Contact
- athreya@simula.ad
