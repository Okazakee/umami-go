import { buildCacheKey, getCached, isFresh, setCached } from '@/lib/cache/queryCache';
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

async function instanceInfo(): Promise<{ prefix: string; scope: string }> {
  const inst = await getInstance();
  if (!inst) throw new Error('No instance configured');
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
