import { LineChart } from '@/components/LineChart';
import { OverviewMap } from '@/components/OverviewMap';
import { TrafficDotHeatmap } from '@/components/TrafficDotHeatmap';
import {
  type DeltaTone,
  KpiCard,
  RankedRow,
  ReferrerRow,
  SectionHeader,
} from '@/components/overview';
import { SkeletonBlock } from '@/components/skeleton';
import { EmptyState, ErrorState, mapRequestErrorToUi } from '@/components/states';
import {
  type MetricPoint,
  type MetricType,
  type TimeUnit,
  type WebsiteStats,
  getWebsiteActiveCached,
  getWebsiteMetricsAllCached,
  getWebsitePageviewsCached,
  getWebsiteStatsCached,
} from '@/lib/api/umamiData';
import {
  type RangeType,
  aggregateDataIntoBuckets,
  calculateIntervals,
  formatLabels,
  getBucketSize,
} from '@/lib/chart/timeSeriesBucketing';
import { rgbaFromHex } from '@/lib/color';
import { ensureSelectedWebsiteId } from '@/lib/ensureWebsiteSelection';
import { lookupCountryCentroid } from '@/lib/geo/countryCentroids';
import {
  type AppSettings,
  DEFAULT_SETTINGS,
  getAppSettings,
  patchAppSettings,
  subscribeAppSettings,
} from '@/lib/storage/settings';
import type { AppTheme } from '@/lib/theme';
import { router, useFocusEffect } from 'expo-router';
import * as React from 'react';
import {
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Card, Dialog, Icon, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function OverviewLoadingSkeleton() {
  const theme = useTheme();
  return (
    <>
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <Card
            key={i}
            mode="contained"
            style={[styles.kpiSkeletonCard, { backgroundColor: theme.colors.surface }]}
          >
            <Card.Content style={{ gap: 10 }}>
              <SkeletonBlock height={14} width="55%" radius={8} />
              <SkeletonBlock height={28} width="65%" radius={10} />
              <SkeletonBlock height={14} width="30%" radius={8} />
            </Card.Content>
          </Card>
        ))}
      </View>

      <Card mode="contained" style={[styles.bigCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.bigCardContent}>
          <View style={styles.bigCardHeader}>
            <View style={styles.bigCardHeaderLeft}>
              <SkeletonBlock height={18} width="45%" radius={8} />
              <SkeletonBlock height={14} width="65%" radius={8} />
            </View>
            <SkeletonBlock height={18} width={70} radius={8} />
          </View>
          <View style={[styles.chartArea, { backgroundColor: theme.colors.surfaceVariant }]}>
            <SkeletonBlock height={120} width="100%" radius={14} />
          </View>
        </Card.Content>
      </Card>

      <View style={styles.skeletonSectionHeader}>
        <SkeletonBlock height={18} width="28%" radius={8} />
        <SkeletonBlock height={14} width={54} radius={8} />
      </View>
      <Card mode="contained" style={[styles.listCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.listCardContent}>
          {[0, 1, 2].map((i) => (
            <View key={`pages-${i}`} style={styles.skeletonListRow}>
              <SkeletonBlock height={14} width="68%" radius={8} />
              <SkeletonBlock height={14} width={44} radius={8} />
            </View>
          ))}
        </Card.Content>
      </Card>

      <View style={styles.skeletonSectionHeader}>
        <SkeletonBlock height={18} width="30%" radius={8} />
        <SkeletonBlock height={14} width={54} radius={8} />
      </View>
      <Card mode="contained" style={[styles.listCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.listCardContent}>
          {[0, 1, 2].map((i) => (
            <View key={`sources-${i}`} style={styles.skeletonListRow}>
              <SkeletonBlock height={14} width="62%" radius={8} />
              <SkeletonBlock height={14} width={44} radius={8} />
            </View>
          ))}
        </Card.Content>
      </Card>
    </>
  );
}

export default function OverviewScreen() {
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const [snack, setSnack] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isRealtimeMode, setIsRealtimeMode] = React.useState(false);
  const [selectedWebsiteId, setSelectedWebsiteIdState] = React.useState<string | null>(null);
  const [_isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<unknown | null>(null);
  const [settings, setSettings] = React.useState<AppSettings>(DEFAULT_SETTINGS);
  const dialogStyle = React.useMemo(() => ({ borderRadius: 12 }), []);
  const [customRangeDialogOpen, setCustomRangeDialogOpen] = React.useState(false);
  const [customStart, setCustomStart] = React.useState('');
  const [customEnd, setCustomEnd] = React.useState('');
  const [customRangeError, setCustomRangeError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<{
    rangeKey: string;
    websiteId: string;
    stats: WebsiteStats;
    seriesUnit: TimeUnit;
    seriesPageviews: MetricPoint[];
    seriesAxisTicks: { key: string; label: string }[];
    pages: MetricPoint[];
    sources: MetricPoint[];
    browsers: MetricPoint[];
    countries: MetricPoint[];
    activeVisitors: number | null;
  } | null>(null);

  const rangeKey = `${settings.defaultTimeRange}:${settings.customRangeStartAt ?? ''}:${settings.customRangeEndAt ?? ''}`;
  const hasDataForCurrentRange =
    !!selectedWebsiteId &&
    !!data &&
    data.rangeKey === rangeKey &&
    data.websiteId === selectedWebsiteId;
  const breathe = React.useRef(new Animated.Value(0)).current;
  const breatheAnimRef = React.useRef<Animated.CompositeAnimation | null>(null);
  const selectedWebsiteIdRef = React.useRef<string | null>(null);
  const dataRef = React.useRef<typeof data>(null);

  React.useEffect(() => {
    selectedWebsiteIdRef.current = selectedWebsiteId;
  }, [selectedWebsiteId]);

  React.useEffect(() => {
    dataRef.current = data;
  }, [data]);

  React.useEffect(() => {
    // "Breathing" realtime dot when realtime mode is enabled.
    if (!isRealtimeMode) {
      breatheAnimRef.current?.stop();
      breatheAnimRef.current = null;
      breathe.setValue(0);
      return;
    }

    breathe.setValue(0);
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    breatheAnimRef.current = anim;
    anim.start();
    return () => {
      anim.stop();
    };
  }, [breathe, isRealtimeMode]);

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

  React.useEffect(() => {
    if (settings.customRangeStartAt) {
      const d = new Date(settings.customRangeStartAt);
      setCustomStart(d.toISOString().slice(0, 10));
    }
    if (settings.customRangeEndAt) {
      const d = new Date(settings.customRangeEndAt);
      setCustomEnd(d.toISOString().slice(0, 10));
    }
  }, [settings.customRangeEndAt, settings.customRangeStartAt]);

  const labelForRange = React.useCallback((r: AppSettings['defaultTimeRange']): string => {
    switch (r) {
      case '24h':
        return '24h';
      case '7d':
        return '7d';
      case '30d':
        return '30d';
      case '90d':
        return '90d';
      case 'all':
        return 'All';
      case 'custom':
        return 'Custom';
    }
  }, []);

  const parseDateYYYYMMDD = React.useCallback((value: string): number | null => {
    const trimmed = value.trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
    const date = new Date(y, mo - 1, d, 0, 0, 0, 0);
    if (Number.isNaN(date.getTime())) return null;
    if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
    return date.getTime();
  }, []);

  const saveCustomRange = React.useCallback(async () => {
    setCustomRangeError(null);
    const startAt = parseDateYYYYMMDD(customStart);
    const endAtDay = parseDateYYYYMMDD(customEnd);
    if (!startAt || !endAtDay) {
      setCustomRangeError('Use YYYY-MM-DD for both dates.');
      return;
    }
    const endAt = endAtDay + 24 * 60 * 60 * 1000 - 1;
    if (startAt > endAt) {
      setCustomRangeError('Start date must be before end date.');
      return;
    }
    await patchAppSettings({
      defaultTimeRange: 'custom',
      customRangeStartAt: startAt,
      customRangeEndAt: endAt,
    });
    setCustomRangeDialogOpen(false);
    setSnack('Custom range saved.');
  }, [customEnd, customStart, parseDateYYYYMMDD]);

  const realtimeDotStyle = React.useMemo(() => {
    if (!isRealtimeMode) return undefined;
    return {
      transform: [
        {
          scale: breathe.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.35],
          }),
        },
      ],
      opacity: breathe.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.55],
      }),
    } as const;
  }, [breathe, isRealtimeMode]);

  const setRange = React.useCallback(async (next: AppSettings['defaultTimeRange']) => {
    if (next === 'custom') {
      setCustomRangeError(null);
      setCustomRangeDialogOpen(true);
      return;
    }
    await patchAppSettings({ defaultTimeRange: next });
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
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (typeof tz === 'string' && tz.length > 0) return tz;
    } catch {
      // ignore
    }
    // Fallback for environments without Intl timeZone support (avoids UTC bucket shifts like 05:00).
    const offsetMin = new Date().getTimezoneOffset(); // minutes behind UTC
    const offsetHours = Math.round(Math.abs(offsetMin) / 60);
    const sign = offsetMin <= 0 ? '-' : '+'; // Etc/GMT has inverted sign
    return `Etc/GMT${sign}${offsetHours}`;
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

  const rangeOptions = React.useMemo(
    () => ['24h', '7d', '30d', '90d', 'all', 'custom'] as const,
    []
  );

  const refreshIntervalMs = React.useMemo(() => {
    // 0 means "manual refresh only"
    return settings.refreshIntervalSeconds === 0
      ? Number.POSITIVE_INFINITY
      : settings.refreshIntervalSeconds * 1000;
  }, [settings.refreshIntervalSeconds]);

  const lastAutoFetchAtRef = React.useRef<number>(0);
  const requestIdRef = React.useRef(0);

  const load = React.useCallback(
    async (mode: 'initial' | 'pull' | 'revalidate' = 'initial') => {
      const requestId = ++requestIdRef.current;
      const isPull = mode === 'pull';
      const isRevalidate = mode === 'revalidate';
      const hasVisibleData = !!dataRef.current && !!selectedWebsiteIdRef.current;
      if (isPull) setIsRefreshing(true);
      else if (mode === 'initial' && !hasVisibleData) setIsLoading(true);

      if (!hasVisibleData && !isRevalidate) setError(null);

      try {
        const ttlMs = isPull || isRevalidate ? 0 : Number.POSITIVE_INFINITY;
        const selection = await ensureSelectedWebsiteId({ websitesTtlMs: ttlMs });
        if (requestId !== requestIdRef.current) return;
        setSelectedWebsiteIdState(selection.selectedWebsiteId);
        if (selection.didAutoSelect && selection.selectedWebsiteId) {
          setSnack('Selected your first website.');
        }

        const websiteId = selection.selectedWebsiteId;
        if (!websiteId) {
          setData(null);
          return;
        }

        const effectiveRangeKey = `${settings.defaultTimeRange}:${settings.customRangeStartAt ?? ''}:${settings.customRangeEndAt ?? ''}`;

        const rangeType = settings.defaultTimeRange as RangeType;
        const now = Date.now();
        const customStartAt = settings.customRangeStartAt ?? null;
        const customEndAt = settings.customRangeEndAt ?? null;

        const rawEndAt = rangeType === 'custom' && customEndAt ? customEndAt : now;
        const rawStartAt =
          rangeType === 'custom' && customStartAt
            ? customStartAt
            : rangeType === '24h'
              ? now - 24 * 60 * 60 * 1000
              : rangeType === '7d'
                ? now - 7 * 24 * 60 * 60 * 1000
                : rangeType === '30d'
                  ? now - 30 * 24 * 60 * 60 * 1000
                  : rangeType === '90d'
                    ? now - 90 * 24 * 60 * 60 * 1000
                    : 0;

        const spec = getBucketSize(
          rangeType,
          rangeType === 'custom' ? { startMs: rawStartAt, endMs: rawEndAt } : undefined
        );

        const unit: TimeUnit =
          spec.granularity === 'hour'
            ? 'hour'
            : spec.granularity === 'day'
              ? 'day'
              : spec.granularity === 'month'
                ? 'month'
                : 'year';

        // Build an interval plan for this range. We use it to pick a stable,
        // human-correct start/end for day-based presets (avoids repeated labels / skew).
        const basePlan = calculateIntervals(rawStartAt, rawEndAt, rangeType);

        const endAt = rangeType === 'custom' ? Math.min(rawEndAt, now) : basePlan.endMs;
        const startAt =
          rangeType === 'all' ? 0 : rangeType === 'custom' ? rawStartAt : basePlan.startMs;

        const [statsRes, pageviewsRes, pagesRes, sourcesRes, browsersRes, countriesRes, activeRes] =
          await Promise.all([
            getWebsiteStatsCached(websiteId, { startAt, endAt, timezone }, ttlMs),
            getWebsitePageviewsCached(websiteId, { startAt, endAt, unit, timezone }, ttlMs),
            // Fetch and cache full datasets; overview UI will render only top 4.
            getWebsiteMetricsAllCached(
              websiteId,
              { type: 'path', startAt, endAt, timezone },
              ttlMs,
              200,
              { cacheTag: effectiveRangeKey }
            ),
            getWebsiteMetricsAllCached(
              websiteId,
              { type: 'referrer', startAt, endAt, timezone },
              ttlMs,
              200,
              { cacheTag: effectiveRangeKey }
            ),
            getWebsiteMetricsAllCached(
              websiteId,
              { type: 'browser', startAt, endAt, timezone },
              ttlMs,
              200,
              { cacheTag: effectiveRangeKey }
            ),
            getWebsiteMetricsAllCached(
              websiteId,
              { type: 'country', startAt, endAt, timezone },
              ttlMs,
              200,
              { cacheTag: effectiveRangeKey }
            ),
            getWebsiteActiveCached(websiteId, ttlMs),
          ]);
        if (requestId !== requestIdRef.current) return;

        const topCountryIso2 =
          typeof countriesRes.data?.[0]?.x === 'string'
            ? (lookupCountryCentroid(countriesRes.data[0].x)?.iso2 ?? null)
            : null;

        // Best-effort: prefetch other tab datasets so detail pages can stay cache-only.
        // Regions/cities are stored separately, scoped to top country (see below).
        const prefetchTypes: MetricType[] = ['entry', 'exit', 'channel', 'os', 'device'];
        await Promise.allSettled(
          prefetchTypes.map((type) =>
            getWebsiteMetricsAllCached(websiteId, { type, startAt, endAt, timezone }, ttlMs, 200, {
              cacheTag: effectiveRangeKey,
            })
          )
        );

        // Regions/cities: Umami UI is typically scoped to a country. Without scoping,
        // many installs return null/unknown region/city labels.
        if (topCountryIso2) {
          const locationTag = `${effectiveRangeKey}:country=${topCountryIso2}`;
          await Promise.allSettled([
            getWebsiteMetricsAllCached(
              websiteId,
              { type: 'region', startAt, endAt, timezone, filters: { country: topCountryIso2 } },
              ttlMs,
              200,
              { cacheTag: locationTag }
            ),
            getWebsiteMetricsAllCached(
              websiteId,
              { type: 'city', startAt, endAt, timezone, filters: { country: topCountryIso2 } },
              ttlMs,
              200,
              { cacheTag: locationTag }
            ),
          ]);
        }

        const rawSeries = pageviewsRes.data.pageviews ?? [];

        // For "all time" we derive the effective chart start from the earliest returned point
        // (otherwise we'd show 1970 as the start).
        let chartStartAt = startAt;
        if (rangeType === 'all') {
          let minT = Number.POSITIVE_INFINITY;
          for (const p of rawSeries) {
            const t = Date.parse(p.x);
            if (Number.isFinite(t) && t < minT) minT = t;
          }
          if (Number.isFinite(minT)) chartStartAt = minT;
        }

        const chartPlan = calculateIntervals(chartStartAt, endAt, rangeType);
        const bucketValues = aggregateDataIntoBuckets(rawSeries, chartPlan.buckets, 'sum');
        const seriesPageviews: MetricPoint[] = chartPlan.buckets.map((b, i) => ({
          x: new Date(b.midMs).toISOString(),
          y: bucketValues[i] ?? 0,
        }));
        const labelGranularity =
          rangeType === 'all' || rangeType === 'custom'
            ? getBucketSize(rangeType, { startMs: chartStartAt, endMs: endAt }).granularity
            : spec.granularity;
        const labels = formatLabels(chartPlan.ticks, rangeType, {
          timeZone: timezone,
          granularity: labelGranularity,
        });
        const seriesAxisTicks = labels.map((label, i) => ({
          key: `${chartPlan.ticks[i] ?? i}:${i}`,
          label,
        }));

        setData({
          rangeKey: effectiveRangeKey,
          websiteId,
          stats: statsRes.data,
          seriesUnit: unit,
          seriesPageviews,
          seriesAxisTicks,
          pages: pagesRes.data,
          sources: sourcesRes.data,
          browsers: browsersRes.data,
          countries: countriesRes.data,
          activeVisitors:
            typeof activeRes.data?.visitors === 'number' ? activeRes.data.visitors : null,
        });

        if (isPull || isRevalidate) {
          lastAutoFetchAtRef.current = Date.now();
        }
      } catch (err) {
        // If we already have something on screen, keep it and just notify.
        if (dataRef.current && selectedWebsiteIdRef.current) {
          setSnack('Failed to refresh.');
        } else {
          setData(null);
          setError(err);
        }
      } finally {
        if (isPull) setIsRefreshing(false);
        setIsLoading(false);
      }
    },
    [settings.customRangeEndAt, settings.customRangeStartAt, settings.defaultTimeRange, timezone]
  );

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      (async () => {
        await load('initial');
        if (cancelled) return;

        // Background revalidate without showing the pull-to-refresh spinner.
        if (settings.refreshIntervalSeconds === 0) return;
        const now = Date.now();
        if (now - lastAutoFetchAtRef.current < refreshIntervalMs) return;
        await load('revalidate');
      })();
      return () => {
        cancelled = true;
      };
    }, [load, refreshIntervalMs, settings.refreshIntervalSeconds])
  );

  // When the user changes the time-range pills (or custom dates), refresh immediately.
  const lastRangeKeyRef = React.useRef<string>(rangeKey);
  React.useEffect(() => {
    if (lastRangeKeyRef.current === rangeKey) return;
    lastRangeKeyRef.current = rangeKey;
    if (!isRealtimeMode) {
      // Switching range should never show previous range data.
      // Show skeletons while we pull cached (or remote) data for the new range.
      setError(null);
      setData(null);
      setIsLoading(true);
      load('initial');
    }
  }, [isRealtimeMode, load, rangeKey]);

  const visitsCount = toNumber(data?.stats.visits) ?? null;
  const bouncesValue = toNumber(data?.stats.bounces) ?? null;
  const totalTimeRaw = toNumber(data?.stats.totaltime) ?? null;
  const pageviewsCount = toNumber(data?.stats.pageviews) ?? null;

  const bounceRatePct =
    bouncesValue === null
      ? null
      : bouncesValue <= 1
        ? bouncesValue * 100
        : visitsCount && visitsCount > 0
          ? (bouncesValue / visitsCount) * 100
          : null;

  const avgVisitDurationSeconds =
    totalTimeRaw === null || visitsCount === null || visitsCount <= 0
      ? null
      : (() => {
          // Umami "Avg. time" is derived from totaltime / visits.
          // Some installs report totaltime in seconds, others in milliseconds.
          // Heuristic: if the per-visit average looks like "milliseconds interpreted as seconds",
          // convert to seconds.
          const avgRaw = totalTimeRaw / visitsCount;
          if (avgRaw > 3600 && avgRaw / 1000 < 3600) return avgRaw / 1000;
          return avgRaw;
        })();

  const chartTitle = React.useMemo(() => {
    const r = settings.defaultTimeRange;
    if (r === '24h') return 'Last 24 hours';
    if (r === '7d') return 'Last 7 days';
    if (r === '30d') return 'Last 30 days';
    if (r === '90d') return 'Last 90 days';
    if (r === 'all') return 'All time';
    if (r === 'custom') {
      if (customStart && customEnd) return `Custom (${customStart} → ${customEnd})`;
      return 'Custom range';
    }
    return 'Last period';
  }, [customEnd, customStart, settings.defaultTimeRange]);

  const chartSubtitle = React.useMemo(() => {
    if (settings.defaultTimeRange === '24h') return 'Views per 4h';
    const u = data?.seriesUnit;
    if (u === 'day') return 'Views per day';
    if (u === 'month') return 'Views per month';
    if (u === 'year') return 'Views per year';
    return 'Views over time';
  }, [data?.seriesUnit, settings.defaultTimeRange]);

  const axisTicks = data?.seriesAxisTicks ?? [];

  const mapCountries = React.useMemo(() => {
    const out: Array<{
      ccn3: string;
      label: string;
      value: number;
      lat: number;
      lng: number;
    }> = [];
    for (const c of data?.countries ?? []) {
      const hit = lookupCountryCentroid(c.x);
      if (!hit) continue;
      out.push({ ccn3: hit.ccn3, label: hit.name, value: c.y, lat: hit.lat, lng: hit.lng });
    }
    return out;
  }, [data?.countries]);

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
            <Animated.View
              style={[
                styles.realtimeDot,
                {
                  backgroundColor: isRealtimeMode
                    ? theme.colors.realtimeOn
                    : theme.colors.realtimeOff,
                },
                realtimeDotStyle,
              ]}
            />
            <Text
              variant="labelLarge"
              style={[styles.realtimeText, { color: theme.colors.primary }]}
            >
              REALTIME
            </Text>
          </Pressable>

          {!isRealtimeMode ? (
            <View style={styles.rangeRow}>
              {rangeOptions.map((r) => {
                const isSelected = settings.defaultTimeRange === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRange(r)}
                    style={[
                      styles.rangePill,
                      {
                        backgroundColor: isSelected
                          ? rgbaFromHex(theme.colors.primary, 0.14)
                          : theme.colors.surfaceVariant,
                        borderColor: isSelected
                          ? rgbaFromHex(theme.colors.primary, 0.35)
                          : rgbaFromHex(theme.colors.onSurfaceVariant, 0.22),
                      },
                    ]}
                  >
                    <Text
                      variant="labelMedium"
                      style={{
                        fontWeight: '700',
                        color: isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant,
                      }}
                    >
                      {labelForRange(r)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

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

        {!hasDataForCurrentRange ? (
          error ? (
            (() => {
              const ui = mapRequestErrorToUi(error);
              return (
                <ErrorState
                  title={ui.title}
                  message={ui.message}
                  onRetry={ui.onPrimaryPress ?? (() => load('revalidate'))}
                  primaryLabel={ui.primaryLabel ?? 'Retry'}
                  secondaryLabel={ui.onPrimaryPress ? 'Retry' : undefined}
                  onSecondaryPress={ui.onPrimaryPress ? () => load('revalidate') : undefined}
                />
              );
            })()
          ) : (
            <OverviewLoadingSkeleton />
          )
        ) : null}

        {hasDataForCurrentRange ? (
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
                  {(data?.pages ?? []).length > 0 ? (
                    (data?.pages ?? []).slice(0, 4).map((p, idx, arr) => {
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
                title="Referrers"
                actionLabel="View all"
                onPress={() => openDetails('sources')}
              />
              <Card
                mode="contained"
                style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
              >
                <Card.Content style={styles.listCardContent}>
                  {(data?.sources ?? []).length > 0 ? (
                    (data?.sources ?? []).slice(0, 4).map((p, _idx, arr) => {
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
                title="Countries"
                actionLabel="View all"
                onPress={() => openDetails('location')}
              />
              <Card
                mode="contained"
                style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
              >
                <Card.Content style={styles.listCardContent}>
                  {(data?.countries ?? []).length > 0 ? (
                    (data?.countries ?? []).slice(0, 4).map((p, _idx, arr) => {
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

              <SectionHeader title="Map" hideAction />
              <Card
                mode="contained"
                style={[styles.bigCard, { backgroundColor: theme.colors.surface }]}
              >
                <Card.Content style={styles.bigCardContent}>
                  <OverviewMap
                    height={170}
                    countries={mapCountries.map((c) => ({
                      ccn3: c.ccn3,
                      label: c.label,
                      value: c.value,
                    }))}
                  />
                </Card.Content>
              </Card>
            </>
          ) : (
            <>
              <View style={styles.grid}>
                <KpiCard
                  title="Visits"
                  icon="eye-outline"
                  value={visitsCount === null ? '—' : formatCompact(visitsCount)}
                  delta={
                    deltaPct(data?.stats.visits) && deltaPct(data?.stats.visits) !== 0
                      ? `${Math.abs(deltaPct(data?.stats.visits) ?? 0).toFixed(0)}%`
                      : undefined
                  }
                  deltaTone={
                    (deltaPct(data?.stats.visits) ?? 0) > 0
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
                  value={bounceRatePct === null ? '—' : `${Math.round(bounceRatePct)}%`}
                />
                <KpiCard
                  title="Avg. Time"
                  icon="clock-outline"
                  value={
                    avgVisitDurationSeconds === null ? '—' : formatDuration(avgVisitDurationSeconds)
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
                      <Text variant="titleLarge">{chartTitle}</Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {chartSubtitle}
                      </Text>
                    </View>
                    <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
                      {pageviewsCount === null ? '—' : formatCompact(pageviewsCount)}
                    </Text>
                  </View>

                  <View
                    style={[styles.chartArea, { backgroundColor: theme.colors.surfaceVariant }]}
                  >
                    {(data?.seriesPageviews?.length ?? 0) >= 2 ? (
                      <LineChart points={data?.seriesPageviews ?? []} height={180} />
                    ) : (
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        No data.
                      </Text>
                    )}
                  </View>

                  {axisTicks.length > 0 ? (
                    <View style={styles.chartAxis}>
                      {axisTicks.map((t) => (
                        <Text
                          key={t.key}
                          variant="labelSmall"
                          style={{ color: theme.colors.onSurfaceVariant }}
                        >
                          {t.label}
                        </Text>
                      ))}
                    </View>
                  ) : null}
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
                    (data?.pages ?? []).slice(0, 4).map((p, idx, arr) => {
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
                    (data?.sources ?? []).slice(0, 4).map((p, _idx, arr) => {
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
                    (data?.browsers ?? []).slice(0, 4).map((p, _idx, arr) => {
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
                    (data?.countries ?? []).slice(0, 4).map((p, _idx, arr) => {
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
                <OverviewMap
                  height={250}
                  countries={mapCountries.map((c) => ({
                    ccn3: c.ccn3,
                    label: c.label,
                    value: c.value,
                  }))}
                />
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

        <Portal>
          <Dialog
            visible={customRangeDialogOpen}
            onDismiss={() => setCustomRangeDialogOpen(false)}
            style={dialogStyle}
          >
            <Dialog.Title>Custom range</Dialog.Title>
            <Dialog.Content>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}
              >
                Enter dates as YYYY-MM-DD.
              </Text>
              <View style={{ gap: 12 }}>
                <TextInput
                  mode="outlined"
                  label="Start date"
                  placeholder="2025-01-01"
                  value={customStart}
                  onChangeText={setCustomStart}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TextInput
                  mode="outlined"
                  label="End date"
                  placeholder="2025-01-18"
                  value={customEnd}
                  onChangeText={setCustomEnd}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {customRangeError ? (
                <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 10 }}>
                  {customRangeError}
                </Text>
              ) : null}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setCustomRangeDialogOpen(false)}>Cancel</Button>
              <Button onPress={saveCustomRange}>Save</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

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
    gap: 16,
    paddingTop: 6,
    paddingBottom: 4,
  },
  rangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  rangePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  kpiSkeletonCard: {
    flex: 1,
    minWidth: 155,
    borderRadius: 16,
    overflow: 'hidden',
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
  skeletonSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  skeletonListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
