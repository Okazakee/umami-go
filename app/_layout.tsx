import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { DEFAULT_SETTINGS, getAppSettings, subscribeAppSettings } from '@/lib/storage/settings';
import { buildAppTheme } from '@/lib/theme';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { PaperProvider } from 'react-native-paper';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoading } = useOnboarding();

  React.useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await getAppSettings();
      if (!mounted) return;
      setSettings(s);
    })();
    const unsubscribe = subscribeAppSettings((s) => setSettings(s));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const theme = React.useMemo(() => {
    // Paper doesn't support true dynamic colors; keep Material You disabled for now.
    return buildAppTheme({ ...settings, useMaterialYou: false });
  }, [settings]);

  return (
    <PaperProvider theme={theme}>
      <OnboardingProvider>
        <RootLayoutNav />
      </OnboardingProvider>
    </PaperProvider>
  );
}
