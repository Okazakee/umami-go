import { buildInstanceCacheKey, getCached, isFresh, setCached } from '@/lib/cache/queryCache';
import { instanceFetchJson } from '@/lib/session/instanceFetch';
import { getInstanceById } from '@/lib/storage/instances';

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

async function apiPrefix(instanceId: string): Promise<string> {
  const inst = await getInstanceById(instanceId);
  if (!inst) throw new Error('Instance not found');
  return inst.setupType === 'cloud' ? '/v1' : '/api';
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

export async function listWebsitesCached(
  instanceId: string,
  ttlMs = 5 * 60 * 1000
): Promise<{
  data: UmamiWebsite[];
  fromCache: boolean;
}> {
  const prefix = await apiPrefix(instanceId);
  const key = buildInstanceCacheKey(instanceId, `websites:${prefix}`);

  const cached = await getCached<WebsitesResponse>(key);
  if (cached && isFresh(cached.storedAt, ttlMs)) {
    return { data: cached.data.data ?? [], fromCache: true };
  }

  const fresh = await instanceFetchJson<WebsitesResponse>(instanceId, `${prefix}/websites`);
  await setCached(key, fresh);
  return { data: fresh.data ?? [], fromCache: false };
}

export async function getWebsiteStatsCached(
  instanceId: string,
  websiteId: string,
  input: { startAt: number; endAt: number; timezone?: string },
  ttlMs = 60 * 1000
): Promise<{ data: WebsiteStats; fromCache: boolean }> {
  const prefix = await apiPrefix(instanceId);
  const qs = toQuery({ startAt: input.startAt, endAt: input.endAt, timezone: input.timezone });
  const key = buildInstanceCacheKey(
    instanceId,
    `stats:${prefix}:${websiteId}:${input.startAt}:${input.endAt}:${input.timezone ?? ''}`
  );

  const cached = await getCached<WebsiteStats>(key);
  if (cached && isFresh(cached.storedAt, ttlMs)) {
    return { data: cached.data, fromCache: true };
  }

  const fresh = await instanceFetchJson<WebsiteStats>(
    instanceId,
    `${prefix}/websites/${websiteId}/stats${qs}`
  );
  await setCached(key, fresh);
  return { data: fresh, fromCache: false };
}

export async function getWebsiteActiveCached(
  instanceId: string,
  websiteId: string,
  ttlMs = 10 * 1000
): Promise<{ data: WebsiteActive; fromCache: boolean }> {
  const prefix = await apiPrefix(instanceId);
  const key = buildInstanceCacheKey(instanceId, `active:${prefix}:${websiteId}`);

  const cached = await getCached<WebsiteActive>(key);
  if (cached && isFresh(cached.storedAt, ttlMs)) {
    return { data: cached.data, fromCache: true };
  }

  const fresh = await instanceFetchJson<WebsiteActive>(
    instanceId,
    `${prefix}/websites/${websiteId}/active`
  );
  await setCached(key, fresh);
  return { data: fresh, fromCache: false };
}
