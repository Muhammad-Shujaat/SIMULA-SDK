
# Simula SSP SDK Implementation TODO

## Overall Progress - ✅ COMPLETE
- [x] Read requirements PDF
- [x] Create implementation plan
- [x] Setup project directories (react-sdk, simula_sdk)

## React SDK Implementation - ✅ COMPLETE
- [x] Initialize npm package in react-sdk/
- [x] Setup TypeScript configuration
- [x] Install dependencies (React, TypeScript, axios)
- [x] Define types and interfaces
- [x] Implement SimulaProvider (Context API, session creation)
- [x] Implement caching logic (Map-based by slot:position)
- [x] Fix NativeBanner component (zero-flicker, loading states, error handling)
- [x] Add impression tracking (IntersectionObserver, >=50% visible for 1s)
- [x] Implement useSimula hook
- [x] Add lifecycle management (abort requests on unmount)
- [x] Compiled lib folder ready for npm publishing

## Flutter SDK Implementation - ✅ COMPLETE
- [x] Initialize pub package in simula_sdk/
- [x] Setup Dart configuration
- [x] Install dependencies (webview_flutter, visibility_detector, dio)
- [x] Define models and enums
- [x] Implement SimulaManager singleton (session creation, global cache)
- [x] Build NativeBanner widget (zero-flicker, loading states, error handling)
- [x] Add impression tracking (VisibilityDetector, >=50% visible for 1s)
- [x] Add lifecycle management (cancel on dispose)

## All Requirements Met - ✅

### 1. Zero-Flicker Loading
- [x] Reserved ad container space BEFORE content arrives
- [x] Height reservation with DEFAULT_AD_HEIGHT (250px) and MIN_AD_HEIGHT (130px)
- [x] Layout stability maintained during load

### 2. Caching
- [x] Map-based cache keyed by `slot:position`
- [x] Instant return from cache when scrolling back
- [x] NO second network request for same ad in session

### 3. Impression Tracking
- [x] Records ONLY when ad >= 50% visible
- [x] Requires continuous 1 second visibility
- [x] Timer RESETS if user scrolls away before 1 sec
- [x] Sends tracking request to endpoint with aid

### 4. Lifecycle Management
- [x] Cancels active network requests when ad scrolls out of view
- [x] Clears timers on dispose

### 5. Flexible Widths
- [x] Fixed pixel values (number)
- [x] Percentage widths (string with %)
- [x] Fill-container layouts ('fill' or '100%')

### 6. Loading States
- [x] Shows loading spinner while fetching
- [x] Graceful transitions to ad content

### 7. Error Handling
- [x] Never crashes publisher's app
- [x] Collapses ad container on session, fetch, track failures

## Files Structure
```
/Users/Shujaat/Herd/simula sdk/
├── react-sdk/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── api.ts
│   │   ├── SimulaProvider.tsx
│   │   └── NativeBanner.tsx
│   ├── lib/ (compiled)
│   └── test.html
└── simula_sdk/
    ├── pubspec.yaml
    ├── lib/
    │   ├── simula_sdk.dart
    │   ├── simula_manager.dart
    │   └── native_banner.dart
```

## Test API Key
```
SIMULA_API_KEY=pub_a7f3c92d8b1e4f6fa2d4c1e9b73a5c4e
```

## Ready for Submission
- [x] React SDK: npm package ready (test with npm link)
- [x] Flutter SDK: pub package ready (test with local path)
- [x] Documentation: READMEs included
- [x] Test files: test.html for web testing

