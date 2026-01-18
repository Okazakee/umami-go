import { RankedRow, ScreenHeader, SectionHeader } from '@/components/details';
import { MockBars } from '@/components/mockChart';
import { KpiCard } from '@/components/overview';
import {
  TimeRangeFilter,
  type TimeRangePreset,
  type TimeRangeValue,
  formatTimeRangeLabel,
} from '@/components/timeRangeFilter';
import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Chip, Divider, Snackbar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrafficRuntimeScreen() {
  const theme = useTheme();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [snack, setSnack] = React.useState<string | null>(null);
  const presets = React.useMemo<TimeRangePreset[]>(
    () => [
      { key: '24h', label: 'Last 24h' },
      { key: '7d', label: '7d' },
      { key: '30d', label: '30d' },
      { key: '90d', label: '90d' },
    ],
    []
  );
  const [range, setRange] = React.useState<TimeRangeValue>({ kind: 'preset', preset: '24h' });
  const [metric, setMetric] = React.useState<'load' | 'ttfb' | 'lcp'>('load');

  const chart = React.useMemo(
    () => [
      { id: 't00', value: 0.18 },
      { id: 't01', value: 0.26 },
      { id: 't02', value: 0.22 },
      { id: 't03', value: 0.3 },
      { id: 't04', value: 0.44 },
      { id: 't05', value: 0.52 },
      { id: 't06', value: 0.61 },
      { id: 't07', value: 0.46 },
      { id: 't08', value: 0.38 },
      { id: 't09', value: 0.55 },
      { id: 't10', value: 0.49 },
      { id: 't11', value: 0.33 },
    ],
    []
  );

  const refresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setSnack('Refreshed.');
    setIsRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <ScreenHeader title="Runtime" subtitle="Traffic (mock)" />

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Summary" subtitle="Key metrics" />
          <Card.Content style={styles.cardContent}>
            <View style={styles.kpiGrid}>
              <KpiCard
                title="Avg load"
                icon="speedometer"
                value="1.42s"
                delta="8%"
                deltaTone="down"
              />
              <KpiCard
                title="p95 load"
                icon="chart-bell-curve"
                value="3.9s"
                delta="2%"
                deltaTone="up"
              />
              <KpiCard title="Fast share" icon="check-circle-outline" value="52%" />
              <KpiCard title="Slow share" icon="alert-circle-outline" value="15%" />
            </View>
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Filters" subtitle="Mock controls" />
          <Card.Content style={styles.cardContent}>
            <TimeRangeFilter value={range} onChange={setRange} presets={presets} />

            <Divider />

            <Text variant="titleMedium">Metric</Text>
            <View style={styles.chipsRow}>
              <Chip selected={metric === 'load'} onPress={() => setMetric('load')}>
                Load
              </Chip>
              <Chip selected={metric === 'ttfb'} onPress={() => setMetric('ttfb')}>
                TTFB
              </Chip>
              <Chip selected={metric === 'lcp'} onPress={() => setMetric('lcp')}>
                LCP
              </Chip>
            </View>

            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              (Mock) Filters: country, device, browser, page
            </Text>
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title
            title="Performance over time"
            subtitle={`${formatTimeRangeLabel(range, presets)} • ${metric.toUpperCase()}`}
          />
          <Card.Content style={styles.cardContent}>
            <MockBars points={chart} height={160} />
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium">Performance</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              (Mock) load time buckets, TTFB, CLS/LCP style metrics
            </Text>
          </Card.Content>
        </Card>

        <SectionHeader
          title="Buckets"
          actionLabel="More"
          onPress={() => setSnack('More (coming soon)')}
        />
        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.list}>
            <RankedRow
              badgeText="≤1s"
              label="Fast"
              value="52%"
              fraction={0.52}
              onPress={() => setSnack('Fast')}
            />
            <RankedRow
              badgeText="1-3s"
              label="Average"
              value="33%"
              fraction={0.33}
              onPress={() => setSnack('Average')}
            />
            <RankedRow
              badgeText=">3s"
              label="Slow"
              value="15%"
              fraction={0.15}
              onPress={() => setSnack('Slow')}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={2500}>
        {snack ?? ''}
      </Snackbar>
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  list: {
    gap: 10,
  },
});
