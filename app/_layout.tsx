import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { PaperProvider } from 'react-native-paper';
import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';
import { appTheme } from '../lib/theme';

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
  return (
    <PaperProvider theme={appTheme}>
      <OnboardingProvider>
        <RootLayoutNav />
      </OnboardingProvider>
    </PaperProvider>
  );
}
