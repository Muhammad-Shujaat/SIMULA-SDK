# Simula SSP SDK Implementation Plan

## Overview
This plan outlines the implementation of a production-ready native ad SDK for React (Web) and Flutter (iOS/Android). The SDK will consist of two separate packages: a React SDK (`@simula/react-sdk`) in TypeScript for npm, and a Flutter SDK (`simula_sdk`) in Dart for pub. Both SDKs must adhere to critical requirements including zero-flicker loading, caching, impression tracking, lifecycle management, flexible widths, loading states, and error handling. The implementation will use the provided API endpoints and test API key (`pub_a7f3c92d8b1e4f6fa2d4c1e9b73a5c4e`).

## Architecture
- **React SDK**: Tree-shakable npm package using TypeScript. Utilizes Context API for session management, IntersectionObserver for lazy loading and impression tracking, AbortController for request cancellation, and a Map-based cache keyed by `slot:position`.
- **Flutter SDK**: Pub package using Dart. Employs singleton pattern for SimulaManager, StatefulWidget for NativeBanner, webview_flutter for ad rendering, visibility_detector for impression tracking, and CancelToken for request cancellation.
- **Shared Concepts**: Session creation on provider/manager initialization, ad fetching with caching, zero-flicker via height reservation (fixed or measured off-screen), impression tracking with ≥50% visibility for 1s continuously, and collapse on errors.

## Components/Modules
### React SDK
- **SimulaProvider**: Context provider for API key and session ID management.
- **NativeBanner**: Component handling ad fetching, rendering, caching, impression tracking, and error handling.
- **useSimula**: Hook for accessing session and cache within components.
- **Utils**: Helpers for caching, height measurement, and API calls.

### Flutter SDK
- **SimulaManager**: Singleton class for API key, session creation, and global cache.
- **NativeBanner**: StatefulWidget for ad display, using WebView and VisibilityDetector.
- **Utils**: Helpers for caching, height measurement, and API calls.

## Implementation Steps
1. **Setup Project Structure**:
   - Create `react-sdk/` directory with npm package structure (package.json, tsconfig.json, src/, lib/).
   - Create `flutter-sdk/` directory with pub package structure (pubspec.yaml, lib/, example/).
   - Initialize git repos in each subdirectory.

2. **Implement React SDK**:
   - Define types and interfaces.
   - Implement SimulaProvider with session creation.
   - Implement caching logic.
   - Build NativeBanner with zero-flicker (height prop or off-screen measurement), loading states, error handling.
   - Add impression tracking using IntersectionObserver.
   - Ensure lifecycle management (abort on unmount).

3. **Implement Flutter SDK**:
   - Define models and enums.
   - Implement SimulaManager singleton with session creation.
   - Implement caching logic.
   - Build NativeBanner widget with zero-flicker (height prop or off-screen WebView), loading states, error handling.
   - Add impression tracking using VisibilityDetector.
   - Ensure lifecycle management (cancel on dispose).

4. **Testing and Validation**:
   - Test with provided mock apps (react-mock-public, flutter-mock-public).
   - Verify zero-flicker, caching, impression tracking, and error scenarios.
   - Ensure cross-platform consistency.

5. **Documentation and Packaging**:
   - Write READMEs with installation and usage instructions.
   - Build and test packages locally (npm link, local pub path).
   - Prepare demo video showcasing features.

## Dependencies
- **React SDK**: React, TypeScript, axios (for API calls).
- **Flutter SDK**: flutter, webview_flutter, visibility_detector, dio (for API calls).

## Risk Mitigation
- Handle API failures gracefully with retries and fallbacks.
- Ensure type safety and avoid runtime errors.
- Test on multiple devices/browsers for compatibility.

## Timeline
- Day 1: Setup and React SDK core implementation.
- Day 2: Flutter SDK implementation and testing.
- Day 3: Integration testing, documentation, and demo.

## Success Criteria
- Zero-flicker loading achieved.
- Caching prevents duplicate requests.
- Impression tracking accurate and non-duplicate.
- SDKs are publishable and easy to integrate.
- All edge cases handled without crashes.
