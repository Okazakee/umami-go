import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="features" />
      <Stack.Screen name="choice" />
      <Stack.Screen name="complete" />
      <Stack.Screen name="verify" />
    </Stack>
  );
}
