import { buildCacheKey, getCached, isFresh, setCached } from '@/lib/cache/queryCache';
import { RequestError } from '@/lib/session/fetch';
import { sessionFetchJson } from '@/lib/session/fetch';
import { getInstance } from '@/lib/storage/singleInstance';

export type UmamiWebsite = {
  id: string;
  name: string;
  domain: string;
};

type WebsitesResponse = {
  data: UmamiWebsite[];
  count?: number;
  page?: number;
  pageSize?: number;
};

export type WebsiteStats = {
  pageviews: unknown;
  visitors: unknown;
  visits?: unknown;
  bounces?: unknown;
  totaltime?: unknown;
  comparison?: unknown;
};

export type WebsiteActive = {
  visitors: number;
};

export type MetricPoint = {
  x: string;
  y: number;
};

export type MetricType =
  | 'path'
  | 'entry'
  | 'exit'
  | 'title'
  | 'query'
  | 'referrer'
  | 'channel'
  | 'domain'
  | 'country'
  | 'region'
  | 'city'
  | 'browser'
  | 'os'
  | 'device'
  | 'language'
  | 'screen'
  | 'event'
  | 'hostname'
  | 'tag';

export type TimeUnit = 'year' | 'month' | 'day' | 'hour';

export type PageviewsTimeseriesResponse = {
  pageviews: MetricPoint[];
  sessions?: MetricPoint[];
};

async function instanceInfo(): Promise<{ prefix: string; scope: string }> {
  const inst = await getInstance();
  if (!inst) throw new RequestError('missing_instance', 'No instance configured.');
  const host = inst.host.replace(/\/$/, '');
  return {
    prefix: inst.setupType === 'cloud' ? '/v1' : '/api',
    // Scope cache to this specific connection/user without storing secrets in the key.
    scope: `${inst.setupType}:${inst.umamiUserId ?? 'unknown'}:${host}`,
  };
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

export async function listWebsitesCached(ttlMs = 5 * 60 * 1000): Promise<{
  data: UmamiWebsite[];
  fromCache: boolean;
}> {
  const { prefix, scope } = await instanceInfo();
  const key = buildCacheKey(`${scope}:websites:${prefix}`);

  const cached = await getCached<WebsitesResponse>(key);
  if (cached && isFresh(cached.storedAt, ttlMs)) {
    return { data: cached.data.data ?? [], fromCache: true };
  }

  const fresh = await sessionFetchJson<WebsitesResponse>(`${prefix}/websites`);
  await setCached(key, fresh);
  return { data: fresh.data ?? [], fromCache: false };
}

export async function getWebsiteStatsCached(
  websiteId: string,
  input: { startAt: number; endAt: number; timezone?: string },
  ttlMs = 60 * 1000
): Promise<{ data: WebsiteStats; fromCache: boolean }> {
  const { prefix, scope } = await instanceInfo();
  const qs = toQuery({ startAt: input.startAt, endAt: input.endAt, timezone: input.timezone });
  const key = buildCacheKey(
    `${scope}:stats:${prefix}:${websiteId}:${input.startAt}:${input.endAt}:${input.timezone ?? ''}`
  );

  const cached = await getCached<WebsiteStats>(key);
  if (cached && isFresh(cached.storedAt, ttlMs)) {
    return { data: cached.data, fromCache: true };
  }

  const fresh = await sessionFetchJson<WebsiteStats>(`${prefix}/websites/${websiteId}/stats${qs}`);
  await setCached(key, fresh);
  return { data: fresh, fromCache: false };
}

export async function getWebsiteActiveCached(
  websiteId: string,
  ttlMs = 10 * 1000
): Promise<{ data: WebsiteActive; fromCache: boolean }> {
  const { prefix, scope } = await instanceInfo();
  const key = buildCacheKey(`${scope}:active:${prefix}:${websiteId}`);

  const cached = await getCached<WebsiteActive>(key);
  if (cached && isFresh(cached.storedAt, ttlMs)) {
    return { data: cached.data, fromCache: true };
  }

  const fresh = await sessionFetchJson<WebsiteActive>(`${prefix}/websites/${websiteId}/active`);
  await setCached(key, fresh);
  return { data: fresh, fromCache: false };
}

export async function getWebsiteMetricsCached(
  websiteId: string,
  input: {
    type: MetricType;
    startAt: number;
    endAt: number;
    timezone?: string;
    limit?: number;
    offset?: number;
  },
  ttlMs = 60 * 1000
): Promise<{ data: MetricPoint[]; fromCache: boolean }> {
  const { prefix, scope } = await instanceInfo();
  const qs = toQuery({
    type: input.type,
    startAt: input.startAt,
    endAt: input.endAt,
    timezone: input.timezone,
    limit: input.limit,
    offset: input.offset,
  });
  const key = buildCacheKey(
    `${scope}:metrics:${prefix}:${websiteId}:${input.type}:${input.startAt}:${input.endAt}:${input.timezone ?? ''}:${input.limit ?? ''}:${input.offset ?? ''}`
  );

  const cached = await getCached<MetricPoint[]>(key);
  if (cached && isFresh(cached.storedAt, ttlMs)) {
    return { data: cached.data, fromCache: true };
  }

  const fresh = await sessionFetchJson<MetricPoint[]>(
    `${prefix}/websites/${websiteId}/metrics${qs}`
  );
  await setCached(key, fresh);
  return { data: fresh, fromCache: false };
}

export async function getWebsiteMetricsAllCached(
  websiteId: string,
  input: {
    type: MetricType;
    startAt: number;
    endAt: number;
    timezone?: string;
    filters?: { country?: string; region?: string; city?: string };
  },
  ttlMs = 60 * 1000,
  pageSize = 200,
  options?: { cacheTag?: string }
): Promise<{ data: MetricPoint[]; fromCache: boolean }> {
  const { prefix, scope } = await instanceInfo();
  const cacheTag = options?.cacheTag?.trim();
  const filtersKey =
    input.filters && (input.filters.country || input.filters.region || input.filters.city)
      ? `:filters:${input.filters.country ?? ''}:${input.filters.region ?? ''}:${input.filters.city ?? ''}`
      : '';
  const key = buildCacheKey(
    cacheTag
      ? `${scope}:metrics-all:${prefix}:${websiteId}:${input.type}:tag:${cacheTag}${filtersKey}:${input.timezone ?? ''}:${pageSize}`
      : `${scope}:metrics-all:${prefix}:${websiteId}:${input.type}:${input.startAt}:${input.endAt}${filtersKey}:${input.timezone ?? ''}:${pageSize}`
  );

  const cached = await getCached<MetricPoint[]>(key);
  if (cached && isFresh(cached.storedAt, ttlMs)) {
    return { data: cached.data, fromCache: true };
  }

  const out: MetricPoint[] = [];
  let offset = 0;
  let guard = 0;
  while (guard++ < 50) {
    const qs = toQuery({
      type: input.type,
      startAt: input.startAt,
      endAt: input.endAt,
      timezone: input.timezone,
      limit: pageSize,
      offset,
      'filters[country]': input.filters?.country,
      'filters[region]': input.filters?.region,
      'filters[city]': input.filters?.city,
    });
    const page = await sessionFetchJson<MetricPoint[]>(
      `${prefix}/websites/${websiteId}/metrics${qs}`
    );
    const arr = Array.isArray(page) ? page : [];
    out.push(...arr);
    if (arr.length < pageSize) break;
    offset += pageSize;
  }

  await setCached(key, out);
  return { data: out, fromCache: false };
}

export async function getWebsiteMetricsAllStored(
  websiteId: string,
  input: { type: MetricType; startAt: number; endAt: number; timezone?: string },
  pageSize = 200,
  options?: { cacheTag?: string }
): Promise<{ data: MetricPoint[]; fromCache: boolean }> {
  const { prefix, scope } = await instanceInfo();
  const cacheTag = options?.cacheTag?.trim();
  const key = buildCacheKey(
    cacheTag
      ? `${scope}:metrics-all:${prefix}:${websiteId}:${input.type}:tag:${cacheTag}:${input.timezone ?? ''}:${pageSize}`
      : `${scope}:metrics-all:${prefix}:${websiteId}:${input.type}:${input.startAt}:${input.endAt}:${input.timezone ?? ''}:${pageSize}`
  );

  const cached = await getCached<MetricPoint[]>(key);
  return { data: cached?.data ?? [], fromCache: true };
}

export async function getWebsitePageviewsCached(
  websiteId: string,
  input: { startAt: number; endAt: number; unit: TimeUnit; timezone?: string },
  ttlMs = 60 * 1000
): Promise<{ data: PageviewsTimeseriesResponse; fromCache: boolean }> {
  const { prefix, scope } = await instanceInfo();
  const qs = toQuery({
    startAt: input.startAt,
    endAt: input.endAt,
    unit: input.unit,
    timezone: input.timezone,
  });
  const key = buildCacheKey(
    `${scope}:pageviews:${prefix}:${websiteId}:${input.startAt}:${input.endAt}:${input.unit}:${input.timezone ?? ''}`
  );

  const cached = await getCached<PageviewsTimeseriesResponse>(key);
  if (cached && isFresh(cached.storedAt, ttlMs)) {
    return { data: cached.data, fromCache: true };
  }

  const fresh = await sessionFetchJson<PageviewsTimeseriesResponse>(
    `${prefix}/websites/${websiteId}/pageviews${qs}`
  );
  await setCached(key, fresh);
  return { data: fresh, fromCache: false };
}
