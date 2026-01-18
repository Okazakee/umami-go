import { router } from 'expo-router';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text variant="headlineMedium">Not found</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          This screen doesn’t exist.
        </Text>

        <View style={styles.actions}>
          <Button mode="contained" onPress={() => router.replace('/')}>
            Go home
          </Button>
          <Button mode="outlined" onPress={() => router.back()}>
            Back
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 10,
  },
  actions: {
    marginTop: 14,
    gap: 10,
  },
});
