# @simula/react-sdk

Simula SSP SDK for React Web - Production-ready native advertising SDK

## Installation

```bash
npm install @simula/react-sdk
```

## Quick Start

### 1. Provider Setup

Wrap your app with the `SimulaProvider` to initialize the session:

```tsx
import { SimulaProvider } from '@simula/react-sdk';

function App() {
  return (
    <SimulaProvider apiKey="pub_a7f3c92d8b1e4f6fa2d4c1e9b73a5c4e">
      <YourApp />
    </SimulaProvider>
  );
}
```

### 2. Component Usage

Use the `NativeBanner` component to display ads in your feed:

```tsx
import { NativeBanner } from '@simula/react-sdk';

function Feed() {
  return (
    <div>
      {/* Your content */}
      <NativeBanner
        slot="explore"
        position={0}
        width="100%"
        height={250}
        onError={(error) => console.error('Ad error:', error)}
        onImpression={() => console.log('Impression tracked!')}
      />
      {/* More content */}
    </div>
  );
}
```

## API Reference

### SimulaProvider

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| apiKey | string | Yes | Your Simula API key |
| children | ReactNode | Yes | Child components |

### NativeBanner

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| slot | string | Yes | Ad slot identifier (e.g., "explore", "feed") |
| position | number | Yes | Ad position in slot (0-indexed) |
| width | string \| number | No | Width: "100%", fixed pixels, or "fill" |
| height | number | No | Fixed height for zero-flicker (recommended) |
| onError | (error: Error) => void | No | Called when ad fetch fails |
| onImpression | () => void | No | Called when impression is tracked |

### Width Options

```tsx
// Percentage width
<NativeBanner width="100%" />

// Fixed pixel width  
<NativeBanner width={320} />

// Fill container
<NativeBanner width="fill" />
```

### useSimula Hook

Access the Simula context directly:

```tsx
import { useSimula } from '@simula/react-sdk';

function CustomAdComponent() {
  const { sessionId, trackImpression } = useSimula();
  
  // Custom implementation
}
```

## Features

### Zero-Flicker Loading
- Reserves container space before ad content arrives
- Uses IntersectionObserver for visibility detection
- Supports both fixed and dynamic heights

### Caching
- Automatic caching by `slot:position` key
- Instant display on scroll-back (no network request)
- Session-scoped cache

### Impression Tracking
- Records impression when ad is ≥50% visible
- Requires continuous 1-second visibility
- Resets timer if ad scrolls out of view
- Uses IntersectionObserver with threshold: [0.5]

### Lifecycle Management
- Cancels all pending requests on unmount
- Clears impression timers on unmount
- Proper cleanup via AbortController

### Error Handling
- Never crashes the publisher's app
- Collapses ad container gracefully on errors
- Provides error callbacks for logging

## Architecture

```
react-sdk/
├── src/
│   ├── index.ts           # Exports
│   ├── types.ts           # TypeScript interfaces
│   ├── api.ts             # API utilities
│   ├── SimulaProvider.tsx # Context provider
│   └── NativeBanner.tsx   # Ad component
├── lib/                   # Compiled output
└── package.json
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
- Web: https://github.com/Simula-AI-SDK/react-mock-public

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev
```

## Local Testing

Link the package locally:

```bash
cd react-sdk
npm link

# In your test project
npm link @simula/react-sdk
```

## Requirements

- React >= 16.8.0
- TypeScript >= 4.9.0
- Modern browsers with IntersectionObserver support

## License

MIT

