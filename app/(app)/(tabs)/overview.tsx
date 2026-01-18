import { type WebsiteStats, getWebsiteStatsCached, listWebsitesCached } from '@/lib/api/umamiData';
import { getAppSettings } from '@/lib/storage/settings';
import { getInstance } from '@/lib/storage/singleInstance';
import { getSelectedWebsiteId, setSelectedWebsiteId } from '@/lib/storage/websiteSelection';
import { router, useFocusEffect } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OverviewScreen() {
  const theme = useTheme();

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [websiteCount, setWebsiteCount] = React.useState<number | null>(null);
  const [selectedWebsiteId, setSelectedWebsiteIdState] = React.useState<string | null>(null);
  const [selectedWebsiteLabel, setSelectedWebsiteLabel] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<WebsiteStats | null>(null);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const inst = await getInstance();
      if (!inst) {
        setError('Not connected.');
        setWebsiteCount(null);
        setSelectedWebsiteIdState(null);
        setSelectedWebsiteLabel(null);
        setStats(null);
        return;
      }

      const websites = await listWebsitesCached();
      setWebsiteCount(websites.data.length);

      let selected = await getSelectedWebsiteId();

      if (websites.data.length === 0) {
        await setSelectedWebsiteId(null);
        setSelectedWebsiteIdState(null);
        setSelectedWebsiteLabel(null);
        setStats(null);
        return;
      }

      if (!selected && websites.data.length === 1) {
        selected = websites.data[0]?.id ?? null;
        if (selected) await setSelectedWebsiteId(selected);
      }

      const selectedWebsite = selected ? websites.data.find((w) => w.id === selected) : undefined;
      if (!selectedWebsite) {
        await setSelectedWebsiteId(null);
        setSelectedWebsiteIdState(null);
        setSelectedWebsiteLabel(null);
        setStats(null);
        return;
      }

      setSelectedWebsiteIdState(selectedWebsite.id);
      setSelectedWebsiteLabel(`${selectedWebsite.name} — ${selectedWebsite.domain}`);

      const settings = await getAppSettings();
      const endAt = Date.now();
      const startAt =
        settings.defaultTimeRange === '24h'
          ? endAt - 24 * 60 * 60 * 1000
          : settings.defaultTimeRange === '7d'
            ? endAt - 7 * 24 * 60 * 60 * 1000
            : settings.defaultTimeRange === '30d'
              ? endAt - 30 * 24 * 60 * 60 * 1000
              : endAt - 90 * 24 * 60 * 60 * 1000;

      const res = await getWebsiteStatsCached(selectedWebsite.id, { startAt, endAt });
      setStats(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overview');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  const isConnected = error !== 'Not connected.';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineMedium">Overview</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {isLoading ? 'Loading…' : error ? error : 'Summary'}
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
          ) : null}
        </View>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Current website" />
          <Card.Content style={styles.cardContent}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Count: {websiteCount ?? (isLoading ? '…' : '0')}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Selected: {selectedWebsiteLabel ?? '(none)'}
            </Text>
            {isConnected && !selectedWebsiteId ? (
              <Button mode="contained" onPress={() => router.push('/(app)/websites')}>
                Choose website
              </Button>
            ) : null}
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Stats" />
          <Card.Content style={styles.cardContent}>
            {!isConnected ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Connect to view stats.
              </Text>
            ) : !selectedWebsiteId ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Select a website to view stats.
              </Text>
            ) : (
              <>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  (Raw response for now; we’ll format KPIs next.)
                </Text>
                <Text
                  variant="bodySmall"
                  selectable
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {stats ? JSON.stringify(stats) : isLoading ? '…' : '(none)'}
                </Text>
              </>
            )}
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
