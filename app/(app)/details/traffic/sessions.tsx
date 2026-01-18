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
import { Card, Chip, Divider, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrafficSessionsScreen() {
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
  const [search, setSearch] = React.useState('');

  const chart = React.useMemo(
    () => [
      { id: 't00', value: 0.22 },
      { id: 't01', value: 0.28 },
      { id: 't02', value: 0.18 },
      { id: 't03', value: 0.4 },
      { id: 't04', value: 0.33 },
      { id: 't05', value: 0.52 },
      { id: 't06', value: 0.44 },
      { id: 't07', value: 0.31 },
      { id: 't08', value: 0.36 },
      { id: 't09', value: 0.61 },
      { id: 't10', value: 0.49 },
      { id: 't11', value: 0.35 },
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
        <ScreenHeader title="Sessions" subtitle="Traffic (mock)" />

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Summary" subtitle="Key metrics" />
          <Card.Content style={styles.cardContent}>
            <View style={styles.kpiGrid}>
              <KpiCard
                title="Sessions"
                icon="timeline-clock-outline"
                value="1,102"
                delta="6%"
                deltaTone="up"
              />
              <KpiCard
                title="Visitors"
                icon="account-multiple-outline"
                value="862"
                delta="4%"
                deltaTone="up"
              />
              <KpiCard title="Pages / session" icon="file-document-outline" value="2.6" />
              <KpiCard title="Avg duration" icon="clock-outline" value="1m 42s" />
            </View>
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Filters" subtitle="Mock controls" />
          <Card.Content style={styles.cardContent}>
            <TextInput
              mode="outlined"
              label="Search sessions"
              value={search}
              onChangeText={setSearch}
              placeholder="referrer, page…"
              right={
                search ? <TextInput.Icon icon="close" onPress={() => setSearch('')} /> : undefined
              }
            />

            <TimeRangeFilter value={range} onChange={setRange} presets={presets} />

            <Divider />

            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              (Mock) Filters: device, country, referrer, entry page
            </Text>
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Sessions over time" subtitle={formatTimeRangeLabel(range, presets)} />
          <Card.Content style={styles.cardContent}>
            <MockBars points={chart} height={160} />
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              (Mock) Sessions list with duration, pages, referrer
            </Text>
          </Card.Content>
        </Card>

        <SectionHeader
          title="Recent sessions"
          actionLabel="More"
          onPress={() => setSnack('More (coming soon)')}
        />

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.list}>
            <RankedRow
              badgeText="S"
              label="2m 41s • 5 pages • google.com"
              value="now"
              fraction={1}
              onPress={() => setSnack('session 1')}
            />
            <RankedRow
              badgeText="S"
              label="38s • 2 pages • (direct)"
              value="1m"
              fraction={0.6}
              onPress={() => setSnack('session 2')}
            />
            <RankedRow
              badgeText="S"
              label="4m 12s • 7 pages • t.co"
              value="3m"
              fraction={0.45}
              onPress={() => setSnack('session 3')}
            />
            <RankedRow
              badgeText="S"
              label="1m 09s • 3 pages • linkedin.com"
              value="6m"
              fraction={0.3}
              onPress={() => setSnack('session 4')}
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
