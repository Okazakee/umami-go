# Umami Go

A mobile application for managing and monitoring your Umami analytics on the go. Built with React Native and Expo.

## Project Goal

Umami Go provides a native mobile experience for interacting with your Umami analytics, allowing you to:
- Connect to self-hosted Umami instances or Umami Cloud
- Monitor your analytics data on the go (Overview + Realtime)
- Switch between websites inside the connected Umami instance

## Features

- **Onboarding Flow**: Guided setup for first-time users
- **Single Instance Connection**: Connect to either self-hosted or Umami Cloud (one connection at a time)
- **Website Selection**: Choose a “current website” used by Overview + Realtime
- **Secure Credential Storage**: Credentials are stored securely on-device
- **Session Keep-Alive**: Revalidates sessions and auto re-logins for self-hosted instances (when possible)
- **Smart Caching (SQLite-backed)**: Cached API reads for faster UX and fewer requests
- **Overview Dashboard**: KPIs, realtime mode, bucketed “views over time” chart, and a world choropleth map
- **Detail Screens (cache-only)**: “View all” pages read the latest saved snapshot; they never fetch remotely
- **Theming**: Light/dark mode toggle and theme presets (Material You is currently disabled)
- **Modern UI**: Built with React Native Paper

## Tech Stack

- **Framework**: [Expo](https://expo.dev) ~54.0.31
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) ~6.0.21
- **UI Library**: [React Native Paper](https://callstack.github.io/react-native-paper/) ^5.x
- **Language**: TypeScript
- **State Management**: React Context API
- **Storage**: SecureStore for sensitive credentials, AsyncStorage for settings/preferences, SQLite for cache

## Prerequisites

- Node.js (v18 or later)
- Bun, npm, or yarn package manager
- Expo CLI (installed globally or via npx)
- iOS Simulator (for iOS development) or Android Emulator (for Android development)

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd umami-go
```

2. Install dependencies:
```bash
bun install
# or
npm install
```

3. Set up environment variables (optional, for development):
```bash
cp .env.local.example .env.local
# Edit .env.local with your Umami instance credentials
```

### Development

Start the development server:
```bash
bun start
# or
npm start
```

For a clean start (clears Metro cache):
```bash
bun run start:clear
# or
npm run start:clear
```

### Running on Devices

**iOS:**
```bash
bun run ios
# or
npm run ios
```

**Android:**
```bash
bun run android
# or
npm run android
```

## Environment Variables (Development Only)

For development convenience, you can create a `.env.local` file with your Umami credentials. These are **never bundled in production builds**.

Example `.env.local`:
```env
# Self-Hosted Configuration
UMAMI_HOST=https://umami.example.com
UMAMI_USERNAME=admin
UMAMI_PASSWORD=your-secure-password

# Umami Cloud Configuration
UMAMI_CLOUD_HOST=https://cloud.umami.is
UMAMI_CLOUD_API_KEY=um_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important**: 
- Never commit `.env.local` to version control (it's already in `.gitignore`)
- These credentials are only used in development mode
- Production builds will always require users to enter credentials via the app UI

## Project Structure

```
umami-go/
├── app/                    # Expo Router app directory
│   ├── (app)/             # Main app screens
│   │   ├── (tabs)/        # Bottom tabs
│   │   │   ├── _layout.tsx
│   │   │   ├── overview.tsx    # Overview + realtime mode + time range pills
│   │   │   ├── websites.tsx    # Website list + selection
│   │   │   ├── more.tsx        # Traffic/Behavior/Audience/Growth entry points (placeholders where needed)
│   │   │   └── settings.tsx    # App settings + connection management
│   │   ├── _layout.tsx
│   │   ├── details/        # “View all” detail pages (cache-only)
│   │   │   ├── _layout.tsx
│   │   │   ├── pages.tsx
│   │   │   ├── sources.tsx
│   │   │   ├── environment.tsx
│   │   │   ├── location.tsx
│   │   │   └── traffic/
│   │   │       ├── _layout.tsx
│   │   │       ├── index.tsx
│   │   │       ├── events.tsx
│   │   │       ├── sessions.tsx
│   │   │       ├── runtime.tsx
│   │   │       ├── compare.tsx
│   │   │       └── breakdown.tsx
│   │   └── debug.tsx
│   ├── (onboarding)/      # Onboarding flow
│   │   ├── welcome.tsx    # Welcome screen
│   │   ├── features.tsx  # Features overview
│   │   ├── choice.tsx     # Choose setup type
│   │   ├── complete.tsx   # Enter credentials
│   │   └── verify.tsx    # Verify connection
│   ├── error.tsx          # Global error boundary
│   ├── +not-found.tsx     # Not-found route
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point with routing logic
├── contexts/              # React Context providers
│   └── OnboardingContext.tsx
├── lib/                   # Utility libraries
│   ├── api/              # API client
│   │   ├── umami.ts      # Umami API client
│   │   └── umamiData.ts  # Cached Umami data helpers
│   ├── cache/            # Query cache primitives
│   │   └── queryCache.ts
│   ├── chart/             # Time series bucketing utilities
│   │   └── timeSeriesBucketing.ts
│   ├── db/                # SQLite schema + DB access
│   │   └── sqlite.ts
│   ├── geo/               # Country mapping helpers
│   │   └── countryCentroids.ts
│   ├── session/          # Session + authenticated fetch helpers
│   │   ├── session.ts
│   │   └── fetch.ts
│   └── storage/          # Storage utilities
│       ├── singleInstance.ts
│       ├── settings.ts
│       └── websiteSelection.ts
├── components/            # Shared UI components
│   ├── OverviewMap.tsx
│   ├── LineChart.tsx
│   ├── states.tsx
│   └── ...
├── assets/               # Images and static assets
├── app.config.ts         # Expo configuration
└── package.json
```

## How “View all” pages work (cache-only)

Detail pages (`app/(app)/details/*`) intentionally **do not fetch remotely**. To update them, refresh the data from **Overview** (pull-to-refresh) for the selected time range; that snapshot is what detail pages display.

## Building for Production

### Android

**Debug:**
```bash
bun run build:android:debug
```

**Release:**
```bash
bun run build:android:release
```

**Bundle:**
```bash
bun run build:android:bundle
```

### iOS

**Debug:**
```bash
bun run build:ios:debug
```

**Release:**
```bash
bun run build:ios:release
```

## Code Quality

This project uses [Biome](https://biomejs.dev/) for linting and formatting.

**Lint:**
```bash
bun run lint
```

**Format:**
```bash
bun run format
```

**Fix:**
```bash
bun run lint:fix
```

## Security Notes

- **Credential Storage**: Sensitive data (passwords, tokens, API keys) are stored using `expo-secure-store`, which provides encrypted storage using the device's keychain (iOS) or keystore (Android)
- **Non-Sensitive Data**: Connection metadata and app settings are stored in AsyncStorage
- Environment variables are only used in development mode
- Production builds never include sensitive credentials
- All API communication uses HTTPS
- Credentials are never transmitted except to the configured Umami instance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests
5. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions, please open an issue on the repository.
