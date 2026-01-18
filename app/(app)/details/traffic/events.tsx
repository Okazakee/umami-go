import { ScreenHeader, SectionHeader } from '@/components/details';
import { MockBars } from '@/components/mockChart';
import { KpiCard } from '@/components/overview';
import {
  TimeRangeFilter,
  type TimeRangePreset,
  type TimeRangeValue,
  formatTimeRangeLabel,
} from '@/components/timeRangeFilter';
import * as React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Chip, Divider, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type EventName = 'all' | 'signup' | 'purchase' | 'cta_click' | 'newsletter_submit';

export default function TrafficEventsScreen() {
  const theme = useTheme();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [snack, setSnack] = React.useState<string | null>(null);
  const [event, setEvent] = React.useState<EventName>('all');
  const [search, setSearch] = React.useState('');
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

  const chart = React.useMemo(
    () => [
      { id: 't00', value: 0.2 },
      { id: 't01', value: 0.34 },
      { id: 't02', value: 0.28 },
      { id: 't03', value: 0.56 },
      { id: 't04', value: 0.45 },
      { id: 't05', value: 0.72 },
      { id: 't06', value: 0.62 },
      { id: 't07', value: 0.41 },
      { id: 't08', value: 0.58 },
      { id: 't09', value: 0.83 },
      { id: 't10', value: 0.66 },
      { id: 't11', value: 0.52 },
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
        <ScreenHeader title="Events" subtitle="Traffic (mock)" />

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Summary" subtitle="Key metrics" />
          <Card.Content style={styles.cardContent}>
            <View style={styles.kpiGrid}>
              <KpiCard
                title="Events"
                icon="cursor-default-click"
                value="1,284"
                delta="12%"
                deltaTone="up"
              />
              <KpiCard
                title="Visitors"
                icon="account-multiple-outline"
                value="862"
                delta="4%"
                deltaTone="up"
              />
              <KpiCard title="Events / visit" icon="chart-timeline-variant" value="1.48" />
              <KpiCard title="Top event" icon="star-outline" value="signup" />
            </View>
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Filters" subtitle="Mock controls" />
          <Card.Content style={styles.cardContent}>
            <TextInput
              mode="outlined"
              label="Search event"
              value={search}
              onChangeText={setSearch}
              placeholder="signup, purchase…"
              right={
                search ? <TextInput.Icon icon="close" onPress={() => setSearch('')} /> : undefined
              }
            />

            <TimeRangeFilter value={range} onChange={setRange} presets={presets} />

            <Divider />

            <Text variant="titleMedium">Event</Text>
            <View style={styles.chipsRow}>
              <Chip selected={event === 'all'} onPress={() => setEvent('all')}>
                All
              </Chip>
              <Chip selected={event === 'signup'} onPress={() => setEvent('signup')}>
                signup
              </Chip>
              <Chip selected={event === 'purchase'} onPress={() => setEvent('purchase')}>
                purchase
              </Chip>
              <Chip selected={event === 'cta_click'} onPress={() => setEvent('cta_click')}>
                cta_click
              </Chip>
              <Chip
                selected={event === 'newsletter_submit'}
                onPress={() => setEvent('newsletter_submit')}
              >
                newsletter_submit
              </Chip>
            </View>
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title
            title="Events over time"
            subtitle={`${formatTimeRangeLabel(range, presets)} • ${event}`}
          />
          <Card.Content style={styles.cardContent}>
            <MockBars points={chart} height={160} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              (Mock) Tap a bar to drill down later.
            </Text>
          </Card.Content>
        </Card>

        <SectionHeader
          title="Top events"
          actionLabel="More"
          onPress={() => setSnack('More (coming soon)')}
        />

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.list}>
            <EventRow
              name="signup"
              events="128"
              visitors="96"
              fraction={1}
              onPress={() => setSnack('signup')}
            />
            <EventRow
              name="purchase"
              events="44"
              visitors="27"
              fraction={0.34}
              onPress={() => setSnack('purchase')}
            />
            <EventRow
              name="cta_click"
              events="31"
              visitors="22"
              fraction={0.24}
              onPress={() => setSnack('cta_click')}
            />
            <EventRow
              name="newsletter_submit"
              events="19"
              visitors="16"
              fraction={0.15}
              onPress={() => setSnack('newsletter_submit')}
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

function EventRow({
  name,
  events,
  visitors,
  fraction,
  onPress,
}: {
  name: string;
  events: string;
  visitors: string;
  fraction: number;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, fraction));

  return (
    <Pressable onPress={onPress} style={styles.rowPressable}>
      <View style={styles.row}>
        <View style={[styles.rowFill, { width: `${Math.round(clamped * 100)}%` }]} />
        <View style={[styles.rowBadge, { backgroundColor: '#262642' }]}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
            E
          </Text>
        </View>
        <View style={styles.rowMain}>
          <Text variant="titleMedium" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Visitors: {visitors}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text variant="titleMedium">{events}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            events
          </Text>
        </View>
      </View>
    </Pressable>
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
  rowPressable: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#1a1930',
  },
  rowFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(75, 55, 254, 0.22)',
  },
  rowBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
});
