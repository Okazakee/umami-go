import { type WebsiteStats, getWebsiteStatsCached, listWebsitesCached } from '@/lib/api/umamiData';
import { getAppSettings } from '@/lib/storage/settings';
import { getSelectedWebsiteId, setSelectedWebsiteId } from '@/lib/storage/websiteSelection';
import { router, useFocusEffect, useGlobalSearchParams } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InstanceOverviewScreen() {
  const theme = useTheme();
  const params = useGlobalSearchParams<{ instanceId?: string | string[] }>();
  const instanceId = Array.isArray(params.instanceId) ? params.instanceId[0] : params.instanceId;

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [websiteCount, setWebsiteCount] = React.useState<number | null>(null);
  const [selectedWebsiteId, setSelectedWebsiteIdState] = React.useState<string | null>(null);
  const [selectedWebsiteLabel, setSelectedWebsiteLabel] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<WebsiteStats | null>(null);

  const refresh = React.useCallback(async () => {
    if (!instanceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const websites = await listWebsitesCached(instanceId);
      setWebsiteCount(websites.data.length);
      let selected = await getSelectedWebsiteId(instanceId);

      if (websites.data.length === 0) {
        await setSelectedWebsiteId(instanceId, null);
        setSelectedWebsiteIdState(null);
        setSelectedWebsiteLabel(null);
        setStats(null);
        setIsLoading(false);
        return;
      }

      // If only one website exists, auto-select it.
      if (!selected && websites.data.length === 1) {
        selected = websites.data[0]?.id ?? null;
        if (selected) await setSelectedWebsiteId(instanceId, selected);
      }

      // If the selected website no longer exists, clear selection.
      const selectedWebsite = selected ? websites.data.find((w) => w.id === selected) : undefined;
      if (!selectedWebsite) {
        await setSelectedWebsiteId(instanceId, null);
        setSelectedWebsiteIdState(null);
        setSelectedWebsiteLabel(null);
        setStats(null);
        setIsLoading(false);
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

      const res = await getWebsiteStatsCached(instanceId, selectedWebsite.id, { startAt, endAt });
      setStats(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overview');
    } finally {
      setIsLoading(false);
    }
  }, [instanceId]);

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
          <Text variant="headlineMedium">Overview</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {isLoading ? 'Loading…' : error ? error : 'Summary'}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button mode="outlined" onPress={refresh} disabled={!instanceId || isLoading}>
            Refresh
          </Button>
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
            {!selectedWebsiteId ? (
              <Button
                mode="contained"
                onPress={() =>
                  instanceId
                    ? router.push({
                        pathname: '/(app)/instance/[instanceId]/websites',
                        params: { instanceId },
                      })
                    : null
                }
                disabled={!instanceId}
              >
                Choose website
              </Button>
            ) : null}
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Stats" />
          <Card.Content style={styles.cardContent}>
            {!selectedWebsiteId ? (
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
