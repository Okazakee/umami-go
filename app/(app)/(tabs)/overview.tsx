import { router } from 'expo-router';
import * as React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Icon, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type DeltaTone = 'up' | 'down';

function DeltaChip({
  tone,
  value,
}: {
  tone: DeltaTone;
  value: string;
}) {
  return (
    <View style={[styles.deltaChip, tone === 'up' ? styles.deltaChipUp : styles.deltaChipDown]}>
      <Text variant="labelSmall" style={styles.deltaChipText}>
        {tone === 'up' ? '↑ ' : '↓ '}
        {value}
      </Text>
    </View>
  );
}

function KpiCard({
  title,
  icon,
  value,
  delta,
  deltaTone,
  onPress,
}: {
  title: string;
  icon: string;
  value: string;
  delta?: string;
  deltaTone?: DeltaTone;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <Card
      mode="contained"
      style={[styles.kpiCard, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
    >
      <Card.Content style={styles.kpiContent}>
        <View style={styles.kpiTopRow}>
          <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {title}
          </Text>
          <Icon source={icon} size={18} color={theme.colors.onSurfaceVariant} />
        </View>
        <View style={styles.kpiBottomRow}>
          <Text variant="headlineMedium" style={styles.kpiValue}>
            {value}
          </Text>
          {delta && deltaTone ? <DeltaChip tone={deltaTone} value={delta} /> : null}
        </View>
      </Card.Content>
    </Card>
  );
}

function SectionHeader({
  title,
  actionLabel = 'View All',
  onPress,
  hideAction,
}: {
  title: string;
  actionLabel?: string;
  onPress?: () => void;
  hideAction?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text variant="titleLarge">{title}</Text>
      {!hideAction && onPress ? (
        <Pressable onPress={onPress} hitSlop={8}>
          <Text variant="titleSmall" style={{ color: theme.colors.primary, fontWeight: '600' }}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function RankedRow({
  rank,
  label,
  value,
  fraction,
  onPress,
}: {
  rank: number;
  label: string;
  value: string;
  fraction: number;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, fraction));

  return (
    <Pressable onPress={onPress} style={styles.rankRowPressable}>
      <View style={styles.rankRow}>
        <View style={[styles.rankRowFill, { width: `${Math.round(clamped * 100)}%` }]} />
        <View style={[styles.rankBadge, { backgroundColor: '#262642' }]}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
            {rank}
          </Text>
        </View>
        <View style={styles.rankRowText}>
          <Text variant="titleMedium" numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          {value}
        </Text>
      </View>
    </Pressable>
  );
}

function ReferrerRow({
  label,
  value,
  fraction,
  iconText,
  onPress,
}: {
  label: string;
  value: string;
  fraction: number;
  iconText: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, fraction));

  return (
    <Pressable onPress={onPress} style={styles.rankRowPressable}>
      <View style={styles.rankRow}>
        <View style={[styles.rankRowFill, { width: `${Math.round(clamped * 100)}%` }]} />
        <View style={[styles.refBadge, { backgroundColor: '#262642' }]}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
            {iconText}
          </Text>
        </View>
        <View style={styles.rankRowText}>
          <Text variant="titleMedium" numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          {value}
        </Text>
      </View>
    </Pressable>
  );
}

export default function OverviewScreen() {
  const theme = useTheme();
  const [snack, setSnack] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isRealtimeMode, setIsRealtimeMode] = React.useState(false);

  const days = React.useMemo(() => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], []);
  const hours = React.useMemo(
    () => ['0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20', '22'],
    []
  );

  const realtimePoints = React.useMemo(
    () => [
      { id: '00', visitors: 0.35, views: 0.55 },
      { id: '01', visitors: 0.55, views: 0.7 },
      { id: '02', visitors: 0.4, views: 0.6 },
      { id: '03', visitors: 0.65, views: 0.85 },
      { id: '04', visitors: 0.25, views: 0.35 },
      { id: '05', visitors: 0.5, views: 0.62 },
      { id: '06', visitors: 0.75, views: 0.9 },
      { id: '07', visitors: 0.45, views: 0.6 },
      { id: '08', visitors: 0.6, views: 0.78 },
    ],
    []
  );

  const openDetails = React.useCallback((screen: string) => {
    router.push(`/(app)/details/${screen}`);
  }, []);

  const openTraffic = React.useCallback((section: string) => {
    router.push(`/(app)/details/traffic/${section}`);
  }, []);

  const refresh = React.useCallback(async () => {
    setIsRefreshing(true);
    // UI-only mock for now; will wire into data later.
    await new Promise((r) => setTimeout(r, 500));
    setSnack('Refreshed.');
    setIsRefreshing(false);
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
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
        <View style={styles.topWrap}>
          <Pressable
            onPress={() => setIsRealtimeMode((v) => !v)}
            style={[
              styles.realtimePill,
              isRealtimeMode ? styles.realtimePillOn : styles.realtimePillOff,
            ]}
          >
            <View
              style={[
                styles.realtimeDot,
                isRealtimeMode ? styles.realtimeDotOn : styles.realtimeDotOff,
              ]}
            />
            <Text variant="labelLarge" style={styles.realtimeText}>
              REALTIME
            </Text>
            <Text variant="labelLarge" style={styles.realtimeStateText}>
              {isRealtimeMode ? 'ON' : 'OFF'}
            </Text>
          </Pressable>

          <Text variant="displayLarge" style={styles.activeNumber}>
            42
          </Text>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Active visitors
          </Text>
        </View>

        {isRealtimeMode ? (
          <>
            <View style={styles.grid}>
              <KpiCard
                title="Views"
                icon="eye-outline"
                value="1.50k"
                onPress={() => openTraffic('overview')}
              />
              <KpiCard
                title="Visitors"
                icon="account-multiple-outline"
                value="319"
                onPress={() => openTraffic('overview')}
              />
              <KpiCard
                title="Events"
                icon="cursor-default-click"
                value="84"
                onPress={() => openTraffic('events')}
              />
              <KpiCard
                title="Countries"
                icon="map-marker-outline"
                value="12"
                onPress={() => openDetails('location')}
              />
            </View>

            <Card
              mode="contained"
              style={[styles.bigCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.bigCardContent}>
                <View style={styles.bigCardHeader}>
                  <View style={styles.bigCardHeaderLeft}>
                    <Text variant="titleLarge">Visitors vs Views</Text>
                    <View style={styles.legendRow}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, styles.legendDotVisitors]} />
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Visitors
                        </Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, styles.legendDotViews]} />
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Views
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
                    live
                  </Text>
                </View>

                <View style={[styles.rtChartArea, { backgroundColor: '#17162a' }]}>
                  {realtimePoints.map((p) => (
                    <View key={p.id} style={styles.rtChartGroup}>
                      <View
                        style={[
                          styles.rtChartBar,
                          styles.rtChartBarVisitors,
                          { height: `${Math.round(p.visitors * 100)}%` },
                        ]}
                      />
                      <View
                        style={[
                          styles.rtChartBar,
                          styles.rtChartBarViews,
                          { height: `${Math.round(p.views * 100)}%` },
                        ]}
                      />
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>

            <SectionHeader
              title="Activity"
              actionLabel="View All"
              onPress={() => setSnack('Coming soon')}
            />
            <Card
              mode="contained"
              style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.listCardContent}>
                <View style={styles.activityRow}>
                  <Text variant="bodyMedium">/pricing</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    3s ago • IT • Chrome
                  </Text>
                </View>
                <View style={styles.activityRow}>
                  <Text variant="bodyMedium">/docs/installation</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    8s ago • US • Safari
                  </Text>
                </View>
                <View style={styles.activityRow}>
                  <Text variant="bodyMedium">/</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    12s ago • DE • Firefox
                  </Text>
                </View>
              </Card.Content>
            </Card>

            <SectionHeader
              title="Pages"
              actionLabel="View All"
              onPress={() => openDetails('pages')}
            />
            <Card
              mode="contained"
              style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.listCardContent}>
                <RankedRow
                  rank={1}
                  label="/"
                  value="412"
                  fraction={1}
                  onPress={() => openDetails('pages')}
                />
                <RankedRow
                  rank={2}
                  label="/pricing"
                  value="128"
                  fraction={0.32}
                  onPress={() => openDetails('pages')}
                />
                <RankedRow
                  rank={3}
                  label="/docs/installation"
                  value="92"
                  fraction={0.22}
                  onPress={() => openDetails('pages')}
                />
              </Card.Content>
            </Card>

            <SectionHeader
              title="Referrers"
              actionLabel="View All"
              onPress={() => openDetails('sources')}
            />
            <Card
              mode="contained"
              style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.listCardContent}>
                <ReferrerRow
                  iconText="G"
                  label="google.com"
                  value="322"
                  fraction={1}
                  onPress={() => openDetails('sources')}
                />
                <ReferrerRow
                  iconText="T"
                  label="t.co"
                  value="204"
                  fraction={0.63}
                  onPress={() => openDetails('sources')}
                />
                <ReferrerRow
                  iconText="D"
                  label="(direct)"
                  value="118"
                  fraction={0.37}
                  onPress={() => openDetails('sources')}
                />
              </Card.Content>
            </Card>

            <SectionHeader
              title="Countries"
              actionLabel="View All"
              onPress={() => openDetails('location')}
            />
            <Card
              mode="contained"
              style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.listCardContent}>
                <ReferrerRow
                  iconText="IT"
                  label="Italy"
                  value="190"
                  fraction={1}
                  onPress={() => openDetails('location')}
                />
                <ReferrerRow
                  iconText="US"
                  label="United States"
                  value="53"
                  fraction={0.28}
                  onPress={() => openDetails('location')}
                />
                <ReferrerRow
                  iconText="DE"
                  label="Germany"
                  value="12"
                  fraction={0.06}
                  onPress={() => openDetails('location')}
                />
              </Card.Content>
            </Card>

            <SectionHeader title="Map" hideAction />
            <Card
              mode="contained"
              style={[styles.bigCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.bigCardContent}>
                <View style={[styles.mapPreview, { backgroundColor: '#17162a' }]}>
                  <View style={styles.mapBlob} />
                  <View style={[styles.mapBlob, styles.mapBlob2]} />
                  <View style={[styles.mapBlob, styles.mapBlob3]} />
                </View>
              </Card.Content>
            </Card>
          </>
        ) : (
          <>
            <View style={styles.grid}>
              <KpiCard
                title="Views"
                icon="eye-outline"
                value="12.5K"
                delta="12%"
                deltaTone="up"
                onPress={() => openDetails('traffic')}
              />
              <KpiCard
                title="Visitors"
                icon="account-multiple-outline"
                value="4.2K"
                delta="5%"
                deltaTone="up"
                onPress={() => openDetails('traffic')}
              />
              <KpiCard
                title="Bounce Rate"
                icon="exit-to-app"
                value="65%"
                delta="2%"
                deltaTone="down"
                onPress={() => openDetails('traffic')}
              />
              <KpiCard
                title="Avg. Time"
                icon="clock-outline"
                value="2m 14s"
                delta="8%"
                deltaTone="up"
                onPress={() => openDetails('traffic')}
              />
            </View>

            <Card
              mode="contained"
              style={[styles.bigCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.bigCardContent}>
                <View style={styles.bigCardHeader}>
                  <View style={styles.bigCardHeaderLeft}>
                    <Text variant="titleLarge">Last 24 Hours</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Unique visitors per hour
                    </Text>
                  </View>
                  <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
                    12.5K
                  </Text>
                </View>

                <View style={[styles.chartArea, { backgroundColor: '#17162a' }]}>
                  <View style={[styles.chartBar, { left: '5%', height: '20%' }]} />
                  <View style={[styles.chartBar, { left: '14%', height: '30%' }]} />
                  <View style={[styles.chartBar, { left: '23%', height: '55%' }]} />
                  <View style={[styles.chartBar, { left: '32%', height: '45%' }]} />
                  <View style={[styles.chartBar, { left: '41%', height: '35%' }]} />
                  <View style={[styles.chartBar, { left: '50%', height: '25%' }]} />
                  <View style={[styles.chartBar, { left: '59%', height: '40%' }]} />
                  <View style={[styles.chartBar, { left: '68%', height: '70%' }]} />
                  <View style={[styles.chartBar, { left: '77%', height: '22%' }]} />
                  <View style={[styles.chartBar, { left: '86%', height: '65%' }]} />
                  <View style={[styles.chartBar, { left: '95%', height: '45%' }]} />
                </View>

                <View style={styles.chartAxis}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    00:00
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    06:00
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    12:00
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    18:00
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Now
                  </Text>
                </View>
              </Card.Content>
            </Card>

            <SectionHeader title="Pages" onPress={() => openDetails('pages')} />
            <Card
              mode="contained"
              style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.listCardContent}>
                <RankedRow
                  rank={1}
                  label="/"
                  value="12.5k"
                  fraction={1}
                  onPress={() => openDetails('pages')}
                />
                <RankedRow
                  rank={2}
                  label="/blog/design-trends-2024"
                  value="8.2k"
                  fraction={0.66}
                  onPress={() => openDetails('pages')}
                />
                <RankedRow
                  rank={3}
                  label="/docs/installation"
                  value="5.1k"
                  fraction={0.41}
                  onPress={() => openDetails('pages')}
                />
                <RankedRow
                  rank={4}
                  label="/pricing"
                  value="3.2k"
                  fraction={0.26}
                  onPress={() => openDetails('pages')}
                />
              </Card.Content>
            </Card>

            <SectionHeader title="Sources" onPress={() => openDetails('sources')} />
            <Card
              mode="contained"
              style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.listCardContent}>
                <ReferrerRow
                  iconText="G"
                  label="google.com"
                  value="8.9k"
                  fraction={1}
                  onPress={() => openDetails('sources')}
                />
                <ReferrerRow
                  iconText="T"
                  label="t.co"
                  value="5.4k"
                  fraction={0.61}
                  onPress={() => openDetails('sources')}
                />
                <ReferrerRow
                  iconText="D"
                  label="(direct)"
                  value="3.1k"
                  fraction={0.35}
                  onPress={() => openDetails('sources')}
                />
              </Card.Content>
            </Card>

            <SectionHeader title="Environment" onPress={() => openDetails('environment')} />
            <Card
              mode="contained"
              style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.listCardContent}>
                <ReferrerRow
                  iconText="C"
                  label="Chrome"
                  value="61%"
                  fraction={0.61}
                  onPress={() => openDetails('environment')}
                />
                <ReferrerRow
                  iconText="F"
                  label="Firefox"
                  value="12%"
                  fraction={0.12}
                  onPress={() => openDetails('environment')}
                />
                <ReferrerRow
                  iconText="S"
                  label="Safari"
                  value="10%"
                  fraction={0.1}
                  onPress={() => openDetails('environment')}
                />
              </Card.Content>
            </Card>

            <SectionHeader title="Location" onPress={() => openDetails('location')} />
            <Card
              mode="contained"
              style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.listCardContent}>
                <ReferrerRow
                  iconText="IT"
                  label="Italy"
                  value="64%"
                  fraction={0.64}
                  onPress={() => openDetails('location')}
                />
                <ReferrerRow
                  iconText="US"
                  label="United States"
                  value="18%"
                  fraction={0.18}
                  onPress={() => openDetails('location')}
                />
                <ReferrerRow
                  iconText="DE"
                  label="Germany"
                  value="4%"
                  fraction={0.04}
                  onPress={() => openDetails('location')}
                />
              </Card.Content>
            </Card>

            <SectionHeader title="Map" hideAction />
            <Card
              mode="contained"
              style={[styles.bigCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.bigCardContent}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  (Mock) World map
                </Text>
                <View style={[styles.mapPreview, { backgroundColor: '#17162a' }]}>
                  <View style={styles.mapBlob} />
                  <View style={[styles.mapBlob, styles.mapBlob2]} />
                  <View style={[styles.mapBlob, styles.mapBlob3]} />
                </View>
              </Card.Content>
            </Card>

            <SectionHeader title="Traffic" hideAction />
            <Card
              mode="contained"
              style={[styles.bigCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.bigCardContent}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  (Mock) Visits by day and hour
                </Text>
                <View style={[styles.heatmap, { backgroundColor: '#17162a' }]}>
                  {days.map((day, row) => (
                    <View key={day} style={styles.heatmapRow}>
                      {hours.map((hour, col) => (
                        <View
                          key={`${day}-${hour}`}
                          style={[
                            styles.heatCell,
                            {
                              opacity: 0.15 + ((row * 7 + col) % 6) * 0.12,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          </>
        )}

        {snack ? (
          <View style={styles.snackWrap}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {snack}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  topWrap: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
    paddingBottom: 4,
  },
  realtimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#1e1e2e',
  },
  realtimePillOn: {
    backgroundColor: '#1e1e2e',
  },
  realtimePillOff: {
    backgroundColor: '#1a1930',
  },
  realtimeDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  realtimeDotOn: {
    backgroundColor: '#4b37fe',
  },
  realtimeDotOff: {
    backgroundColor: '#5c5c75',
  },
  realtimeText: {
    color: '#9a93ff',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  realtimeStateText: {
    color: '#d6d4ff',
    letterSpacing: 0.8,
    fontWeight: '800',
    opacity: 0.7,
  },
  activeNumber: {
    fontWeight: '800',
    letterSpacing: -1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  kpiContent: {
    gap: 10,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  kpiValue: {
    fontWeight: '800',
  },
  deltaChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  deltaChipUp: {
    backgroundColor: 'rgba(0, 200, 155, 0.18)',
  },
  deltaChipDown: {
    backgroundColor: 'rgba(255, 135, 60, 0.18)',
  },
  deltaChipText: {
    color: '#d6d4ff',
    fontWeight: '700',
  },
  bigCard: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  bigCardContent: {
    gap: 12,
  },
  bigCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  bigCardHeaderLeft: {
    gap: 2,
    flex: 1,
  },
  chartArea: {
    height: 210,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  chartBar: {
    position: 'absolute',
    bottom: 12,
    width: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(75, 55, 254, 0.55)',
  },
  rtChartArea: {
    height: 210,
    borderRadius: 16,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  rtChartGroup: {
    width: 22,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
  },
  rtChartBar: {
    width: 9,
    borderRadius: 8,
  },
  rtChartBarVisitors: {
    backgroundColor: 'rgba(160, 150, 255, 0.65)',
  },
  rtChartBarViews: {
    backgroundColor: 'rgba(75, 55, 254, 0.75)',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
  },
  legendDotVisitors: {
    backgroundColor: 'rgba(160, 150, 255, 0.9)',
  },
  legendDotViews: {
    backgroundColor: 'rgba(75, 55, 254, 0.95)',
  },
  activityRow: {
    gap: 2,
    paddingVertical: 6,
  },
  chartAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 6,
  },
  listCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  listCardContent: {
    gap: 10,
  },
  rankRowPressable: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  rankRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#1a1930',
  },
  rankRowFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(75, 55, 254, 0.22)',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankRowText: {
    flex: 1,
  },
  snackWrap: {
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  heatmap: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
    gap: 8,
  },
  heatmapRow: {
    flexDirection: 'row',
    gap: 6,
  },
  heatCell: {
    flex: 1,
    height: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(75, 55, 254, 1)',
  },
  mapPreview: {
    height: 170,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  mapBlob: {
    position: 'absolute',
    left: '10%',
    top: '25%',
    width: '45%',
    height: '35%',
    borderRadius: 999,
    backgroundColor: 'rgba(75, 55, 254, 0.35)',
    transform: [{ rotate: '-8deg' }],
  },
  mapBlob2: {
    left: '42%',
    top: '20%',
    width: '50%',
    height: '40%',
    backgroundColor: 'rgba(75, 55, 254, 0.22)',
    transform: [{ rotate: '10deg' }],
  },
  mapBlob3: {
    left: '30%',
    top: '55%',
    width: '38%',
    height: '26%',
    backgroundColor: 'rgba(75, 55, 254, 0.18)',
    transform: [{ rotate: '0deg' }],
  },
});
