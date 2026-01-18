import { RankedRow, ScreenHeader, SectionHeader } from '@/components/details';
import { MockBars } from '@/components/mockChart';
import { KpiCard } from '@/components/overview';
import {
  TimeRangeFilter,
  type TimeRangePreset,
  type TimeRangeValue,
  formatTimeRangeLabel,
} from '@/components/timeRangeFilter';
import { rgbaFromHex } from '@/lib/color';
import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Divider, Snackbar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrafficCompareScreen() {
  const theme = useTheme();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [snack, setSnack] = React.useState<string | null>(null);
  const presets = React.useMemo<TimeRangePreset[]>(
    () => [
      { key: '7d', label: '7d' },
      { key: '30d', label: '30d' },
      { key: 'prev', label: 'Previous' },
    ],
    []
  );
  const [rangeA, setRangeA] = React.useState<TimeRangeValue>({ kind: 'preset', preset: '7d' });
  const [rangeB, setRangeB] = React.useState<TimeRangeValue>({ kind: 'preset', preset: 'prev' });

  const seriesA = React.useMemo(
    () => [
      { id: 't00', value: 0.28 },
      { id: 't01', value: 0.33 },
      { id: 't02', value: 0.3 },
      { id: 't03', value: 0.42 },
      { id: 't04', value: 0.39 },
      { id: 't05', value: 0.52 },
      { id: 't06', value: 0.48 },
      { id: 't07', value: 0.36 },
      { id: 't08', value: 0.41 },
      { id: 't09', value: 0.58 },
      { id: 't10', value: 0.51 },
      { id: 't11', value: 0.4 },
    ],
    []
  );
  const seriesB = React.useMemo(
    () => [
      { id: 't00b', value: 0.24 },
      { id: 't01b', value: 0.29 },
      { id: 't02b', value: 0.27 },
      { id: 't03b', value: 0.38 },
      { id: 't04b', value: 0.31 },
      { id: 't05b', value: 0.46 },
      { id: 't06b', value: 0.41 },
      { id: 't07b', value: 0.32 },
      { id: 't08b', value: 0.35 },
      { id: 't09b', value: 0.51 },
      { id: 't10b', value: 0.45 },
      { id: 't11b', value: 0.34 },
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
        <ScreenHeader title="Compare" subtitle="Traffic (mock)" />

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Summary" subtitle="Key deltas" />
          <Card.Content style={styles.cardContent}>
            <View style={styles.kpiGrid}>
              <KpiCard title="Views" icon="eye-outline" value="+12%" />
              <KpiCard title="Visitors" icon="account-multiple-outline" value="+5%" />
              <KpiCard title="Bounce" icon="backup-restore" value="-2%" />
              <KpiCard title="Avg time" icon="clock-outline" value="+8%" />
            </View>
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Ranges" subtitle="Mock controls" />
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium">Range A</Text>
            <TimeRangeFilter value={rangeA} onChange={setRangeA} presets={presets} />
            <Divider />
            <Text variant="titleMedium">Range B</Text>
            <TimeRangeFilter value={rangeB} onChange={setRangeB} presets={presets} />
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium">Period A vs Period B</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              (Mock) pick two ranges and compare deltas
            </Text>
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title
            title="Trend"
            subtitle={`A: ${formatTimeRangeLabel(rangeA, presets)} • B: ${formatTimeRangeLabel(rangeB, presets)}`}
          />
          <Card.Content style={styles.cardContent}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Range A
            </Text>
            <MockBars points={seriesA} height={110} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Range B
            </Text>
            <MockBars
              points={seriesB}
              height={110}
              color={rgbaFromHex(theme.colors.primary, 0.45)}
            />
          </Card.Content>
        </Card>

        <SectionHeader
          title="KPIs"
          actionLabel="More"
          onPress={() => setSnack('More (coming soon)')}
        />
        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.list}>
            <RankedRow
              badgeText="V"
              label="Views"
              value="+12%"
              fraction={0.7}
              onPress={() => setSnack('Views')}
            />
            <RankedRow
              badgeText="U"
              label="Visitors"
              value="+5%"
              fraction={0.45}
              onPress={() => setSnack('Visitors')}
            />
            <RankedRow
              badgeText="B"
              label="Bounce"
              value="-2%"
              fraction={0.25}
              onPress={() => setSnack('Bounce')}
            />
            <RankedRow
              badgeText="T"
              label="Avg Time"
              value="+8%"
              fraction={0.5}
              onPress={() => setSnack('Avg Time')}
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
