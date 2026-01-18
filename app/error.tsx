import type { ErrorBoundaryProps } from 'expo-router';
import { router } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GlobalErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="headlineMedium">Something went wrong</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          The app hit an unexpected error. You can retry, or go back.
        </Text>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium">Error</Text>
            <Text selectable variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {error?.message || String(error)}
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.actions}>
          <Button mode="contained" onPress={retry}>
            Retry
          </Button>
          <Button mode="outlined" onPress={() => router.back()}>
            Back
          </Button>
          <Button mode="outlined" onPress={() => router.replace('/')}>
            Home
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    gap: 8,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
});
