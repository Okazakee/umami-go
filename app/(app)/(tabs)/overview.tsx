import { OverviewMap } from '@/components/OverviewMap';
import { TrafficDotHeatmap } from '@/components/TrafficDotHeatmap';
import {
  type DeltaTone,
  KpiCard,
  RankedRow,
  ReferrerRow,
  SectionHeader,
} from '@/components/overview';
import { EmptyState, ErrorState, LoadingState, mapRequestErrorToUi } from '@/components/states';
import {
  type MetricPoint,
  type WebsiteStats,
  getWebsiteActiveCached,
  getWebsiteMetricsCached,
  getWebsiteStatsCached,
} from '@/lib/api/umamiData';
import { rgbaFromHex } from '@/lib/color';
import { ensureSelectedWebsiteId } from '@/lib/ensureWebsiteSelection';
import {
  type AppSettings,
  DEFAULT_SETTINGS,
  getAppSettings,
  subscribeAppSettings,
} from '@/lib/storage/settings';
import type { AppTheme } from '@/lib/theme';
import { router, useFocusEffect } from 'expo-router';
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
  const [selectedWebsiteId, setSelectedWebsiteIdState] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<unknown | null>(null);
  const [settings, setSettings] = React.useState<AppSettings>(DEFAULT_SETTINGS);
  const [data, setData] = React.useState<{
    stats: WebsiteStats;
    pages: MetricPoint[];
    sources: MetricPoint[];
    browsers: MetricPoint[];
    countries: MetricPoint[];
    activeVisitors: number | null;
  } | null>(null);

  const isReady = !!selectedWebsiteId && !!data;
  const selectedWebsiteIdRef = React.useRef<string | null>(null);
  const dataRef = React.useRef<typeof data>(null);

  React.useEffect(() => {
    selectedWebsiteIdRef.current = selectedWebsiteId;
  }, [selectedWebsiteId]);

  React.useEffect(() => {
    dataRef.current = data;
  }, [data]);

  React.useEffect(() => {
    let mounted = true;
    getAppSettings().then((s) => {
      if (mounted) setSettings(s);
    });
    const unsubscribe = subscribeAppSettings((s) => setSettings(s));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

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

  const timezone = React.useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return undefined;
    }
  }, []);

  const toNumber = React.useCallback((value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (value && typeof value === 'object') {
      const v = (value as { value?: unknown }).value;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
    }
    return null;
  }, []);

  const deltaPct = React.useCallback((value: unknown): number | null => {
    if (!value || typeof value !== 'object') return null;
    const obj = value as { value?: unknown; prev?: unknown; change?: unknown };
    const v = typeof obj.value === 'number' ? obj.value : null;
    const prev = typeof obj.prev === 'number' ? obj.prev : null;
    const change = typeof obj.change === 'number' ? obj.change : null;

    if (change !== null) {
      const pct = Math.abs(change) <= 1 ? change * 100 : change;
      return Number.isFinite(pct) ? pct : null;
    }
    if (v !== null && prev !== null && prev !== 0) {
      return ((v - prev) / prev) * 100;
    }
    return null;
  }, []);

  const formatCompact = React.useCallback((n: number): string => {
    if (!Number.isFinite(n)) return '—';
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
    if (abs >= 1_000) return `${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
    return String(Math.round(n));
  }, []);

  const formatPercent = React.useCallback((v: number): string => {
    const pct = v <= 1 ? v * 100 : v;
    return `${Math.round(pct)}%`;
  }, []);

  const formatDuration = React.useCallback((seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) return '—';
    const total = Math.round(seconds);
    const m = Math.floor(total / 60);
    const s = total % 60;
    if (m <= 0) return `${s}s`;
    return `${m}m ${s}s`;
  }, []);

  const iconTextFor = React.useCallback((label: string): string => {
    const trimmed = (label ?? '').trim();
    if (!trimmed) return '?';
    if (trimmed.startsWith('(')) return trimmed.slice(1, 2).toUpperCase();
    if (trimmed.includes('.')) return trimmed.slice(0, 1).toUpperCase();
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return trimmed.slice(0, 2).toUpperCase();
  }, []);

  const refreshIntervalMs = React.useMemo(() => {
    // 0 means "manual refresh only"
    return settings.refreshIntervalSeconds === 0
      ? Number.POSITIVE_INFINITY
      : settings.refreshIntervalSeconds * 1000;
  }, [settings.refreshIntervalSeconds]);

  const load = React.useCallback(
    async (mode: 'initial' | 'pull' = 'initial') => {
      const isPull = mode === 'pull';
      const hasVisibleData = !!dataRef.current && !!selectedWebsiteIdRef.current;
      if (isPull) setIsRefreshing(true);
      else if (!hasVisibleData) setIsLoading(true);

      if (!hasVisibleData) setError(null);

      try {
        const ttlMs = isPull ? 0 : refreshIntervalMs;
        const selection = await ensureSelectedWebsiteId({ websitesTtlMs: ttlMs });
        setSelectedWebsiteIdState(selection.selectedWebsiteId);
        if (selection.didAutoSelect && selection.selectedWebsiteId) {
          setSnack('Selected your first website.');
        }

        const websiteId = selection.selectedWebsiteId;
        if (!websiteId) {
          setData(null);
          return;
        }

        const endAt = Date.now();
        const rangeMs =
          settings.defaultTimeRange === '24h'
            ? 24 * 60 * 60 * 1000
            : settings.defaultTimeRange === '7d'
              ? 7 * 24 * 60 * 60 * 1000
              : settings.defaultTimeRange === '30d'
                ? 30 * 24 * 60 * 60 * 1000
                : 90 * 24 * 60 * 60 * 1000;
        const startAt = endAt - rangeMs;

        const [statsRes, pagesRes, sourcesRes, browsersRes, countriesRes, activeRes] =
          await Promise.all([
            getWebsiteStatsCached(websiteId, { startAt, endAt, timezone }, ttlMs),
            getWebsiteMetricsCached(
              websiteId,
              { type: 'path', startAt, endAt, timezone, limit: 4 },
              ttlMs
            ),
            getWebsiteMetricsCached(
              websiteId,
              { type: 'referrer', startAt, endAt, timezone, limit: 3 },
              ttlMs
            ),
            getWebsiteMetricsCached(
              websiteId,
              { type: 'browser', startAt, endAt, timezone, limit: 3 },
              ttlMs
            ),
            getWebsiteMetricsCached(
              websiteId,
              { type: 'country', startAt, endAt, timezone, limit: 3 },
              ttlMs
            ),
            getWebsiteActiveCached(websiteId, ttlMs),
          ]);

        setData({
          stats: statsRes.data,
          pages: pagesRes.data,
          sources: sourcesRes.data,
          browsers: browsersRes.data,
          countries: countriesRes.data,
          activeVisitors:
            typeof activeRes.data?.visitors === 'number' ? activeRes.data.visitors : null,
        });
      } catch (err) {
        // If we already have something on screen, keep it and just notify.
        if (dataRef.current && selectedWebsiteIdRef.current) {
          setSnack('Failed to refresh.');
        } else {
          setData(null);
          setError(err);
        }
      } finally {
        setIsRefreshing(false);
        setIsLoading(false);
      }
    },
    [refreshIntervalMs, settings.defaultTimeRange, timezone]
  );

  useFocusEffect(
    React.useCallback(() => {
      load('initial');
    }, [load])
  );

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
            onRefresh={() => load('pull')}
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
                {data?.activeVisitors ?? '—'}
              </Text>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Active visitors
              </Text>
            </>
          ) : null}
        </View>

        {!isReady ? (
          isLoading ? (
            <LoadingState description="Fetching analytics…" />
          ) : error ? (
            (() => {
              const ui = mapRequestErrorToUi(error);
              return (
                <ErrorState
                  title={ui.title}
                  message={ui.message}
                  onRetry={ui.onPrimaryPress ?? (() => load('pull'))}
                  primaryLabel={ui.primaryLabel ?? 'Retry'}
                  secondaryLabel={ui.onPrimaryPress ? 'Retry' : undefined}
                  onSecondaryPress={ui.onPrimaryPress ? () => load('pull') : undefined}
                />
              );
            })()
          ) : !selectedWebsiteId ? (
            <EmptyState
              title="No websites found"
              description="Create a website in Umami, then pull to refresh."
              primaryLabel="Open Websites"
              onPrimaryPress={() => router.push('/(app)/websites')}
            />
          ) : null
        ) : null}

        {isReady ? (
          isRealtimeMode ? (
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
                          <Text
                            variant="bodySmall"
                            style={{ color: theme.colors.onSurfaceVariant }}
                          >
                            Visitors
                          </Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View
                            style={[styles.legendDot, { backgroundColor: realtimeViewsColor }]}
                          />
                          <Text
                            variant="bodySmall"
                            style={{ color: theme.colors.onSurfaceVariant }}
                          >
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
                <KpiCard
                  title="Views"
                  icon="eye-outline"
                  value={
                    toNumber(data?.stats.pageviews) === null
                      ? '—'
                      : formatCompact(toNumber(data?.stats.pageviews) as number)
                  }
                  delta={
                    deltaPct(data?.stats.pageviews) && deltaPct(data?.stats.pageviews) !== 0
                      ? `${Math.abs(deltaPct(data?.stats.pageviews) ?? 0).toFixed(0)}%`
                      : undefined
                  }
                  deltaTone={
                    (deltaPct(data?.stats.pageviews) ?? 0) > 0
                      ? ('up' as DeltaTone)
                      : ('down' as DeltaTone)
                  }
                />
                <KpiCard
                  title="Visitors"
                  icon="account-multiple-outline"
                  value={
                    toNumber(data?.stats.visitors) === null
                      ? '—'
                      : formatCompact(toNumber(data?.stats.visitors) as number)
                  }
                  delta={
                    deltaPct(data?.stats.visitors) && deltaPct(data?.stats.visitors) !== 0
                      ? `${Math.abs(deltaPct(data?.stats.visitors) ?? 0).toFixed(0)}%`
                      : undefined
                  }
                  deltaTone={
                    (deltaPct(data?.stats.visitors) ?? 0) > 0
                      ? ('up' as DeltaTone)
                      : ('down' as DeltaTone)
                  }
                />
                <KpiCard
                  title="Bounce Rate"
                  icon="exit-to-app"
                  value={
                    toNumber(data?.stats.bounces) !== null
                      ? formatPercent(toNumber(data?.stats.bounces) as number)
                      : '—'
                  }
                  delta={
                    deltaPct(data?.stats.bounces) && deltaPct(data?.stats.bounces) !== 0
                      ? `${Math.abs(deltaPct(data?.stats.bounces) ?? 0).toFixed(0)}%`
                      : undefined
                  }
                  deltaTone={
                    (deltaPct(data?.stats.bounces) ?? 0) > 0
                      ? ('up' as DeltaTone)
                      : ('down' as DeltaTone)
                  }
                />
                <KpiCard
                  title="Avg. Time"
                  icon="clock-outline"
                  value={
                    toNumber(data?.stats.totaltime) !== null
                      ? formatDuration(toNumber(data?.stats.totaltime) as number)
                      : '—'
                  }
                  delta={
                    deltaPct(data?.stats.totaltime) && deltaPct(data?.stats.totaltime) !== 0
                      ? `${Math.abs(deltaPct(data?.stats.totaltime) ?? 0).toFixed(0)}%`
                      : undefined
                  }
                  deltaTone={
                    (deltaPct(data?.stats.totaltime) ?? 0) > 0
                      ? ('up' as DeltaTone)
                      : ('down' as DeltaTone)
                  }
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
                      {toNumber(data?.stats.visitors) === null
                        ? '—'
                        : formatCompact(toNumber(data?.stats.visitors) as number)}
                    </Text>
                  </View>

                  <View
                    style={[styles.chartArea, { backgroundColor: theme.colors.surfaceVariant }]}
                  >
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
                  {(data?.pages ?? []).length > 0 ? (
                    (data?.pages ?? []).map((p, idx, arr) => {
                      const top = arr[0]?.y ?? 0;
                      const fraction = top > 0 ? p.y / top : 0;
                      return (
                        <RankedRow
                          key={`${p.x}:${p.y}`}
                          rank={idx + 1}
                          label={p.x}
                          value={formatCompact(p.y)}
                          fraction={fraction}
                        />
                      );
                    })
                  ) : (
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      No data.
                    </Text>
                  )}
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
                  {(data?.sources ?? []).length > 0 ? (
                    (data?.sources ?? []).map((p, _idx, arr) => {
                      const top = arr[0]?.y ?? 0;
                      const fraction = top > 0 ? p.y / top : 0;
                      return (
                        <ReferrerRow
                          key={`${p.x}:${p.y}`}
                          iconText={iconTextFor(p.x)}
                          label={p.x}
                          value={formatCompact(p.y)}
                          fraction={fraction}
                        />
                      );
                    })
                  ) : (
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      No data.
                    </Text>
                  )}
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
                  {(data?.browsers ?? []).length > 0 ? (
                    (data?.browsers ?? []).map((p, _idx, arr) => {
                      const total = toNumber(data?.stats.visitors) ?? null;
                      const top = arr[0]?.y ?? 0;
                      const fraction = top > 0 ? p.y / top : 0;
                      const value =
                        total && total > 0
                          ? formatPercent((p.y / total) * 100)
                          : formatCompact(p.y);
                      return (
                        <ReferrerRow
                          key={`${p.x}:${p.y}`}
                          iconText={iconTextFor(p.x)}
                          label={p.x}
                          value={value}
                          fraction={fraction}
                        />
                      );
                    })
                  ) : (
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      No data.
                    </Text>
                  )}
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
                  {(data?.countries ?? []).length > 0 ? (
                    (data?.countries ?? []).map((p, _idx, arr) => {
                      const total = toNumber(data?.stats.visitors) ?? null;
                      const top = arr[0]?.y ?? 0;
                      const fraction = top > 0 ? p.y / top : 0;
                      const value =
                        total && total > 0
                          ? formatPercent((p.y / total) * 100)
                          : formatCompact(p.y);
                      return (
                        <ReferrerRow
                          key={`${p.x}:${p.y}`}
                          iconText={iconTextFor(p.x)}
                          label={p.x}
                          value={value}
                          fraction={fraction}
                        />
                      );
                    })
                  ) : (
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      No data.
                    </Text>
                  )}
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
          )
        ) : null}

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
