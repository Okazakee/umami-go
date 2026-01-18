import { router } from 'expo-router';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium">Home</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Welcome to your Umami Go dashboard
      </Text>
      {__DEV__ ? (
        <Button
          mode="contained"
          onPress={() => router.push('/(app)/debug')}
          style={styles.debugButton}
        >
          Debug
        </Button>
      ) : null}
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
  debugButton: {
    marginTop: 24,
  },
});
