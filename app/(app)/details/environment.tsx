import { RankedRow, ScreenHeader, SectionHeader } from '@/components/details';
import { EmptyState, ErrorState } from '@/components/states';
import { type MetricType, getWebsiteMetricsAllStored } from '@/lib/api/umamiData';
import { type RangeType, calculateIntervals } from '@/lib/chart/timeSeriesBucketing';
import { DEFAULT_SETTINGS, getAppSettings, subscribeAppSettings } from '@/lib/storage/settings';
import { getSelectedWebsiteId } from '@/lib/storage/websiteSelection';
import { getDeviceTimeZone } from '@/lib/timezone';
import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 'browsers' | 'os' | 'devices';

function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return String(Math.round(n));
}

export default function EnvironmentDetailsScreen() {
  const theme = useTheme();
  const [tab, setTab] = React.useState<Tab>('browsers');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = React.useState(false);
  const [items, setItems] = React.useState<Array<{ x: string; y: number }>>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<unknown | null>(null);

  React.useEffect(() => {
    let mounted = true;
    getAppSettings().then((s) => {
      if (!mounted) return;
      setSettings(s);
      setSettingsLoaded(true);
    });
    const unsub = subscribeAppSettings((s) => setSettings(s));
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const loadFromCache = React.useCallback(
    async (mode: 'initial' | 'pull' = 'initial') => {
      if (mode === 'pull') setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      try {
        const websiteId = await getSelectedWebsiteId();
        if (!websiteId) {
          setItems([]);
          return;
        }

        const rangeType = settings.defaultTimeRange as RangeType;
        const now = Date.now();
        const rawEndAt =
          rangeType === 'custom' && settings.customRangeEndAt ? settings.customRangeEndAt : now;
        const rawStartAt =
          rangeType === 'custom' && settings.customRangeStartAt
            ? settings.customRangeStartAt
            : rangeType === '24h'
              ? now - 24 * 60 * 60 * 1000
              : rangeType === '7d'
                ? now - 7 * 24 * 60 * 60 * 1000
                : rangeType === '30d'
                  ? now - 30 * 24 * 60 * 60 * 1000
                  : rangeType === '90d'
                    ? now - 90 * 24 * 60 * 60 * 1000
                    : 0;
        const basePlan = calculateIntervals(rawStartAt, rawEndAt, rangeType);
        const endAt = rangeType === 'custom' ? Math.min(rawEndAt, now) : basePlan.endMs;
        const startAt =
          rangeType === 'all' ? 0 : rangeType === 'custom' ? rawStartAt : basePlan.startMs;
        const cacheTag = `${settings.defaultTimeRange}:${settings.customRangeStartAt ?? ''}:${settings.customRangeEndAt ?? ''}`;

        const metricType: MetricType =
          tab === 'browsers' ? 'browser' : tab === 'os' ? 'os' : 'device';
        const res = await getWebsiteMetricsAllStored(
          websiteId,
          { type: metricType, startAt, endAt, timezone: getDeviceTimeZone() },
          200,
          { cacheTag }
        );
        setItems(res.data ?? []);
      } catch (err) {
        setError(err);
        setItems([]);
      } finally {
        setIsRefreshing(false);
        setIsLoading(false);
      }
    },
    [settings.customRangeEndAt, settings.customRangeStartAt, settings.defaultTimeRange, tab]
  );

  React.useEffect(() => {
    if (!settingsLoaded) return;
    loadFromCache('initial');
  }, [loadFromCache, settingsLoaded]);

  const title = tab === 'browsers' ? 'Environment' : tab === 'os' ? 'Operating systems' : 'Devices';
  const top = items[0]?.y ?? 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadFromCache('pull')}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <ScreenHeader
          title={title}
          subtitle={isLoading ? 'Loading saved data…' : `Saved data • ${items.length} item(s)`}
        />

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <SegmentedButtons
              value={tab}
              onValueChange={(v) => setTab(v as Tab)}
              buttons={[
                { value: 'browsers', label: 'Browsers' },
                { value: 'os', label: 'OS' },
                { value: 'devices', label: 'Devices' },
              ]}
            />
          </Card.Content>
        </Card>

        <SectionHeader title="Top" actionLabel="Saved" />

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.list}>
            {error ? (
              <ErrorState message={(error as { message?: string })?.message ?? String(error)} />
            ) : items.length > 0 ? (
              items.map((p, _idx) => {
                const raw =
                  typeof (p as { x?: unknown }).x === 'string'
                    ? ((p as { x: string }).x ?? '')
                    : '';
                const label = raw.trim() || '(unknown)';
                const badge = label === '(unknown)' ? '—' : label.slice(0, 1).toUpperCase();
                return (
                  <RankedRow
                    key={`${label}:${p.y}:${_idx}`}
                    badgeText={badge}
                    label={label}
                    value={formatCompact(p.y)}
                    fraction={top > 0 ? p.y / top : 0}
                  />
                );
              })
            ) : isLoading ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Loading…
              </Text>
            ) : (
              <EmptyState
                title="No saved data yet"
                description="Open Overview and pull to refresh to save data for this range."
              />
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
    paddingBottom: 24,
    gap: 14,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    gap: 10,
  },
  list: {
    gap: 10,
  },
});
