import { getWebsiteActiveCached, listWebsitesCached } from '@/lib/api/umamiData';
import { getInstance } from '@/lib/storage/singleInstance';
import { getSelectedWebsiteId, setSelectedWebsiteId } from '@/lib/storage/websiteSelection';
import { router, useFocusEffect } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RealtimeScreen() {
  const theme = useTheme();

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedWebsiteLabel, setSelectedWebsiteLabel] = React.useState<string | null>(null);
  const [activeVisitors, setActiveVisitors] = React.useState<number | null>(null);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const inst = await getInstance();
      if (!inst) {
        setError('Not connected.');
        setSelectedWebsiteLabel(null);
        setActiveVisitors(null);
        return;
      }

      const websites = await listWebsitesCached();
      let selected = await getSelectedWebsiteId();

      if (websites.data.length === 0) {
        await setSelectedWebsiteId(null);
        setSelectedWebsiteLabel(null);
        setActiveVisitors(null);
        return;
      }

      if (!selected && websites.data.length === 1) {
        selected = websites.data[0]?.id ?? null;
        if (selected) await setSelectedWebsiteId(selected);
      }

      const selectedWebsite = selected ? websites.data.find((w) => w.id === selected) : undefined;
      if (!selectedWebsite) {
        await setSelectedWebsiteId(null);
        setSelectedWebsiteLabel(null);
        setActiveVisitors(null);
        return;
      }

      setSelectedWebsiteLabel(`${selectedWebsite.name} — ${selectedWebsite.domain}`);
      const active = await getWebsiteActiveCached(selectedWebsite.id);
      setActiveVisitors(active.data.visitors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load realtime');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineMedium">Realtime</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {isLoading ? 'Loading…' : error ? error : (selectedWebsiteLabel ?? 'Select a website')}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button mode="outlined" onPress={refresh} disabled={isLoading}>
            Refresh
          </Button>
          {error === 'Not connected.' ? (
            <Button mode="contained" onPress={() => router.push('/(onboarding)/welcome')}>
              Connect
            </Button>
          ) : (
            <Button mode="contained" onPress={() => router.push('/(app)/websites')}>
              Choose website
            </Button>
          )}
        </View>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Active visitors (last ~5 min)" />
          <Card.Content style={styles.cardContent}>
            <Text variant="displaySmall">{activeVisitors ?? (isLoading ? '…' : '—')}</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    gap: 12,
  },
  header: {
    gap: 4,
    paddingVertical: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    gap: 6,
  },
});
