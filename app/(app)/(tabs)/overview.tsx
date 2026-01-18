import { OverviewMap } from '@/components/OverviewMap';
import { TrafficDotHeatmap } from '@/components/TrafficDotHeatmap';
import {
  type DeltaTone,
  KpiCard,
  RankedRow,
  ReferrerRow,
  SectionHeader,
} from '@/components/overview';
import { rgbaFromHex } from '@/lib/color';
import type { AppTheme } from '@/lib/theme';
import { router } from 'expo-router';
import * as React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Icon, Text, useTheme } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OverviewScreen() {
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const [snack, setSnack] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isRealtimeMode, setIsRealtimeMode] = React.useState(false);

  const realtimeViewsColor = React.useMemo(
    () => rgbaFromHex(theme.colors.primary, 0.85),
    [theme.colors.primary]
  );
  const realtimeVisitorsColor = React.useMemo(
    () => rgbaFromHex(theme.colors.primary, 0.45),
    [theme.colors.primary]
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
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 24 + 78 + insets.bottom }]}
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
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: isRealtimeMode
                  ? rgbaFromHex(theme.colors.primary, 0.35)
                  : rgbaFromHex(theme.colors.onSurfaceVariant, 0.22),
              },
            ]}
          >
            <View
              style={[
                styles.realtimeDot,
                {
                  backgroundColor: isRealtimeMode
                    ? theme.colors.realtimeOn
                    : theme.colors.realtimeOff,
                },
              ]}
            />
            <Text
              variant="labelLarge"
              style={[styles.realtimeText, { color: theme.colors.primary }]}
            >
              REALTIME
            </Text>
          </Pressable>

          {isRealtimeMode ? (
            <>
              <Text variant="displayLarge" style={styles.activeNumber}>
                42
              </Text>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Active visitors
              </Text>
            </>
          ) : null}
        </View>

        {isRealtimeMode ? (
          <>
            <View style={styles.grid}>
              <KpiCard title="Views" icon="eye-outline" value="1.50k" />
              <KpiCard title="Visitors" icon="account-multiple-outline" value="319" />
              <KpiCard title="Events" icon="cursor-default-click" value="84" />
              <KpiCard title="Countries" icon="map-marker-outline" value="12" />
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
                        <View
                          style={[styles.legendDot, { backgroundColor: realtimeVisitorsColor }]}
                        />
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Visitors
                        </Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: realtimeViewsColor }]} />
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

                <View
                  style={[styles.rtChartArea, { backgroundColor: theme.colors.surfaceVariant }]}
                >
                  {realtimePoints.map((p) => (
                    <View key={p.id} style={styles.rtChartGroup}>
                      <View
                        style={[
                          styles.rtChartBar,
                          { backgroundColor: realtimeVisitorsColor },
                          { height: `${Math.round(p.visitors * 100)}%` },
                        ]}
                      />
                      <View
                        style={[
                          styles.rtChartBar,
                          { backgroundColor: realtimeViewsColor },
                          { height: `${Math.round(p.views * 100)}%` },
                        ]}
                      />
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>

            <SectionHeader title="Activity" />
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
              actionLabel="View all"
              onPress={() => openDetails('pages')}
            />
            <Card
              mode="contained"
              style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.listCardContent}>
                <RankedRow rank={1} label="/" value="412" fraction={1} />
                <RankedRow rank={2} label="/pricing" value="128" fraction={0.32} />
                <RankedRow rank={3} label="/docs/installation" value="92" fraction={0.22} />
              </Card.Content>
            </Card>

            <SectionHeader
              title="Referrers"
              actionLabel="View all"
              onPress={() => openDetails('sources')}
            />
            <Card
              mode="contained"
              style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.listCardContent}>
                <ReferrerRow iconText="G" label="google.com" value="322" fraction={1} />
                <ReferrerRow iconText="T" label="t.co" value="204" fraction={0.63} />
                <ReferrerRow iconText="D" label="(direct)" value="118" fraction={0.37} />
              </Card.Content>
            </Card>

            <SectionHeader
              title="Countries"
              actionLabel="View all"
              onPress={() => openDetails('location')}
            />
            <Card
              mode="contained"
              style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.listCardContent}>
                <ReferrerRow iconText="IT" label="Italy" value="190" fraction={1} />
                <ReferrerRow iconText="US" label="United States" value="53" fraction={0.28} />
                <ReferrerRow iconText="DE" label="Germany" value="12" fraction={0.06} />
              </Card.Content>
            </Card>

            <SectionHeader title="Map" hideAction />
            <Card
              mode="contained"
              style={[styles.bigCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.bigCardContent}>
                <OverviewMap height={170} />
              </Card.Content>
            </Card>
          </>
        ) : (
          <>
            <View style={styles.grid}>
              <KpiCard title="Views" icon="eye-outline" value="12.5K" delta="12%" deltaTone="up" />
              <KpiCard
                title="Visitors"
                icon="account-multiple-outline"
                value="4.2K"
                delta="5%"
                deltaTone="up"
              />
              <KpiCard
                title="Bounce Rate"
                icon="exit-to-app"
                value="65%"
                delta="2%"
                deltaTone="down"
              />
              <KpiCard
                title="Avg. Time"
                icon="clock-outline"
                value="2m 14s"
                delta="8%"
                deltaTone="up"
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

                <View style={[styles.chartArea, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        left: '5%',
                        height: '20%',
                        backgroundColor: rgbaFromHex(theme.colors.primary, 0.55),
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      {
                        left: '14%',
                        height: '30%',
                        backgroundColor: rgbaFromHex(theme.colors.primary, 0.55),
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      {
                        left: '23%',
                        height: '55%',
                        backgroundColor: rgbaFromHex(theme.colors.primary, 0.55),
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      {
                        left: '32%',
                        height: '45%',
                        backgroundColor: rgbaFromHex(theme.colors.primary, 0.55),
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      {
                        left: '41%',
                        height: '35%',
                        backgroundColor: rgbaFromHex(theme.colors.primary, 0.55),
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      {
                        left: '50%',
                        height: '25%',
                        backgroundColor: rgbaFromHex(theme.colors.primary, 0.55),
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      {
                        left: '59%',
                        height: '40%',
                        backgroundColor: rgbaFromHex(theme.colors.primary, 0.55),
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      {
                        left: '68%',
                        height: '70%',
                        backgroundColor: rgbaFromHex(theme.colors.primary, 0.55),
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      {
                        left: '77%',
                        height: '22%',
                        backgroundColor: rgbaFromHex(theme.colors.primary, 0.55),
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      {
                        left: '86%',
                        height: '65%',
                        backgroundColor: rgbaFromHex(theme.colors.primary, 0.55),
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      {
                        left: '95%',
                        height: '45%',
                        backgroundColor: rgbaFromHex(theme.colors.primary, 0.55),
                      },
                    ]}
                  />
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

            <SectionHeader
              title="Pages"
              actionLabel="View all"
              onPress={() => openDetails('pages')}
            />
            <Card
              mode="contained"
              style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.listCardContent}>
                <RankedRow rank={1} label="/" value="12.5k" fraction={1} />
                <RankedRow rank={2} label="/blog/design-trends-2024" value="8.2k" fraction={0.66} />
                <RankedRow rank={3} label="/docs/installation" value="5.1k" fraction={0.41} />
                <RankedRow rank={4} label="/pricing" value="3.2k" fraction={0.26} />
              </Card.Content>
            </Card>

            <SectionHeader
              title="Sources"
              actionLabel="View all"
              onPress={() => openDetails('sources')}
            />
            <Card
              mode="contained"
              style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.listCardContent}>
                <ReferrerRow iconText="G" label="google.com" value="8.9k" fraction={1} />
                <ReferrerRow iconText="T" label="t.co" value="5.4k" fraction={0.61} />
                <ReferrerRow iconText="D" label="(direct)" value="3.1k" fraction={0.35} />
              </Card.Content>
            </Card>

            <SectionHeader
              title="Environment"
              actionLabel="View all"
              onPress={() => openDetails('environment')}
            />
            <Card
              mode="contained"
              style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.listCardContent}>
                <ReferrerRow iconText="C" label="Chrome" value="61%" fraction={0.61} />
                <ReferrerRow iconText="F" label="Firefox" value="12%" fraction={0.12} />
                <ReferrerRow iconText="S" label="Safari" value="10%" fraction={0.1} />
              </Card.Content>
            </Card>

            <SectionHeader
              title="Location"
              actionLabel="View all"
              onPress={() => openDetails('location')}
            />
            <Card
              mode="contained"
              style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.listCardContent}>
                <ReferrerRow iconText="IT" label="Italy" value="64%" fraction={0.64} />
                <ReferrerRow iconText="US" label="United States" value="18%" fraction={0.18} />
                <ReferrerRow iconText="DE" label="Germany" value="4%" fraction={0.04} />
              </Card.Content>
            </Card>

            <SectionHeader title="Map" hideAction />
            <Card
              mode="contained"
              style={[styles.bigCard, { backgroundColor: theme.colors.surface }]}
            >
              <OverviewMap height={250} />
            </Card>

            <SectionHeader title="Traffic" hideAction />
            <Card
              mode="contained"
              style={[styles.bigCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={styles.bigCardContent}>
                <TrafficDotHeatmap />
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
    borderWidth: 1,
  },
  realtimeDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  realtimeText: {
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  realtimeStateText: {
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
  activityRow: {
    gap: 2,
    paddingVertical: 6,
  },
  chartAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  listCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  listCardContent: {
    gap: 10,
  },
  snackWrap: {
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  heatmap: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
    gap: 10,
  },
});
