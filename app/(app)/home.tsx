import { router } from 'expo-router';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useOnboarding } from '../../contexts/OnboardingContext';

export default function HomeScreen() {
  const theme = useTheme();
  const { resetOnboarding } = useOnboarding();

  const handleResetOnboarding = async () => {
    await resetOnboarding();
    router.replace('/(onboarding)/welcome');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium">Home</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Welcome to your Umami Go dashboard
      </Text>
      <Button
        mode="outlined"
        onPress={handleResetOnboarding}
        style={styles.resetButton}
      >
        Reset Onboarding
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
  resetButton: {
    marginTop: 24,
  },
});
