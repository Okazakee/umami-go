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
import {
  Card,
  Chip,
  Divider,
  SegmentedButtons,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type Dimension = 'page' | 'referrer' | 'country' | 'device';

export default function TrafficBreakdownScreen() {
  const theme = useTheme();
  const [dimension, setDimension] = React.useState<Dimension>('page');
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
      { id: 't01', value: 0.31 },
      { id: 't02', value: 0.26 },
      { id: 't03', value: 0.36 },
      { id: 't04', value: 0.43 },
      { id: 't05', value: 0.52 },
      { id: 't06', value: 0.46 },
      { id: 't07', value: 0.33 },
      { id: 't08', value: 0.38 },
      { id: 't09', value: 0.57 },
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
        <ScreenHeader title="Breakdown" subtitle="Traffic (mock)" />

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Summary" subtitle="Key metrics" />
          <Card.Content style={styles.cardContent}>
            <View style={styles.kpiGrid}>
              <KpiCard title="Views" icon="eye-outline" value="12.5k" />
              <KpiCard title="Visitors" icon="account-multiple-outline" value="8.2k" />
              <KpiCard title="Countries" icon="map-marker-outline" value="12" />
              <KpiCard title="Devices" icon="laptop" value="3" />
            </View>
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Filters" subtitle="Mock controls" />
          <Card.Content style={styles.cardContent}>
            <TextInput
              mode="outlined"
              label="Search"
              value={search}
              onChangeText={setSearch}
              placeholder="page, referrer, country…"
              right={
                search ? <TextInput.Icon icon="close" onPress={() => setSearch('')} /> : undefined
              }
            />

            <TimeRangeFilter value={range} onChange={setRange} presets={presets} />

            <Divider />

            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              (Mock) Breakdown dimension selects what the table shows.
            </Text>
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <SegmentedButtons
              value={dimension}
              onValueChange={(v) => setDimension(v as Dimension)}
              buttons={[
                { value: 'page', label: 'Page' },
                { value: 'referrer', label: 'Referrer' },
                { value: 'country', label: 'Country' },
                { value: 'device', label: 'Device' },
              ]}
            />
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title
            title="Trend"
            subtitle={`${formatTimeRangeLabel(range, presets)} • ${dimension}`}
          />
          <Card.Content style={styles.cardContent}>
            <MockBars points={chart} height={160} />
          </Card.Content>
        </Card>

        <SectionHeader
          title="Top"
          actionLabel="More"
          onPress={() => setSnack('More (coming soon)')}
        />
        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.list}>
            {dimension === 'page' ? (
              <>
                <RankedRow
                  rank={1}
                  label="/"
                  value="12.5k"
                  fraction={1}
                  onPress={() => setSnack('/')}
                />
                <RankedRow
                  rank={2}
                  label="/pricing"
                  value="3.2k"
                  fraction={0.26}
                  onPress={() => setSnack('/pricing')}
                />
                <RankedRow
                  rank={3}
                  label="/docs/installation"
                  value="2.1k"
                  fraction={0.18}
                  onPress={() => setSnack('/docs/installation')}
                />
              </>
            ) : dimension === 'referrer' ? (
              <>
                <RankedRow
                  badgeText="G"
                  label="google.com"
                  value="8.9k"
                  fraction={1}
                  onPress={() => setSnack('google.com')}
                />
                <RankedRow
                  badgeText="T"
                  label="t.co"
                  value="5.4k"
                  fraction={0.61}
                  onPress={() => setSnack('t.co')}
                />
                <RankedRow
                  badgeText="D"
                  label="(direct)"
                  value="3.1k"
                  fraction={0.35}
                  onPress={() => setSnack('(direct)')}
                />
              </>
            ) : dimension === 'country' ? (
              <>
                <RankedRow
                  badgeText="IT"
                  label="Italy"
                  value="64%"
                  fraction={0.64}
                  onPress={() => setSnack('Italy')}
                />
                <RankedRow
                  badgeText="US"
                  label="United States"
                  value="18%"
                  fraction={0.18}
                  onPress={() => setSnack('United States')}
                />
                <RankedRow
                  badgeText="DE"
                  label="Germany"
                  value="4%"
                  fraction={0.04}
                  onPress={() => setSnack('Germany')}
                />
              </>
            ) : (
              <>
                <RankedRow
                  badgeText="D"
                  label="Desktop"
                  value="58%"
                  fraction={0.58}
                  onPress={() => setSnack('Desktop')}
                />
                <RankedRow
                  badgeText="M"
                  label="Mobile"
                  value="38%"
                  fraction={0.38}
                  onPress={() => setSnack('Mobile')}
                />
                <RankedRow
                  badgeText="T"
                  label="Tablet"
                  value="4%"
                  fraction={0.04}
                  onPress={() => setSnack('Tablet')}
                />
              </>
            )}
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
