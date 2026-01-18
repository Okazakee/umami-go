import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { ConfigContext } from 'expo/config';

interface DevCredentials {
  selfHosted?: {
    host: string;
    username: string;
    password: string;
  };
  cloud?: {
    host: string;
    apiKey: string;
  };
}

export default ({ config }: ConfigContext) => {
  // Load .env.local if it exists (only in dev)
  const isDev = process.env.NODE_ENV !== 'production';
  let devCredentials: DevCredentials | null = null;

  if (isDev) {
    try {
      // Load .env.local file
      dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

      // Only expose credentials in dev mode
      const umamiHost = process.env.UMAMI_HOST;
      const umamiUsername = process.env.UMAMI_USERNAME;
      const umamiPassword = process.env.UMAMI_PASSWORD;
      const cloudHost = process.env.UMAMI_CLOUD_HOST;
      const cloudApiKey = process.env.UMAMI_CLOUD_API_KEY;

      if (umamiHost && umamiUsername && umamiPassword) {
        devCredentials = {
          selfHosted: {
            host: umamiHost,
            username: umamiUsername,
            password: umamiPassword,
          },
        };
      }

      if (cloudHost && cloudApiKey) {
        devCredentials = {
          ...devCredentials,
          cloud: {
            host: cloudHost,
            apiKey: cloudApiKey,
          },
        };
      }
    } catch (_error) {
      // .env.local doesn't exist or can't be read - that's okay
    }
  }

  return {
    ...config,
    expo: {
      name: 'umami-go',
      slug: 'umami-go',
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'light',
      newArchEnabled: true,
      scheme: 'umami-go',
      splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
      ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.okazakee.umamigo',
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#ffffff',
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        package: 'com.okazakee.umamigo',
      },
      plugins: ['expo-router'],
      // Only include dev credentials in dev mode - never in production bundle
      extra: isDev && devCredentials ? { devCredentials } : {},
    },
  } as typeof config;
};
