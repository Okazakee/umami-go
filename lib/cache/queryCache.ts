import AsyncStorage from '@react-native-async-storage/async-storage';

type CacheRecord<T> = {
  v: 1;
  storedAt: number;
  data: T;
};

const PREFIX = '@umami-go:cache:';
const memory = new Map<string, { storedAt: number; data: unknown }>();

export function buildCacheKey(key: string): string {
  return `${PREFIX}${key}`;
}

export function buildInstanceCacheKey(instanceId: string, key: string): string {
  // Legacy helper (multi-instance). Keep for backwards compatibility.
  return buildCacheKey(`${instanceId}:${key}`);
}

export function isFresh(storedAt: number, ttlMs: number): boolean {
  return Date.now() - storedAt <= ttlMs;
}

export async function getCached<T>(fullKey: string): Promise<CacheRecord<T> | null> {
  const mem = memory.get(fullKey);
  if (mem) {
    return { v: 1, storedAt: mem.storedAt, data: mem.data as T };
  }

  const raw = await AsyncStorage.getItem(fullKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CacheRecord<T>;
    if (!parsed || parsed.v !== 1 || typeof parsed.storedAt !== 'number') return null;
    memory.set(fullKey, { storedAt: parsed.storedAt, data: parsed.data as unknown });
    return parsed;
  } catch {
    return null;
  }
}

export async function setCached<T>(fullKey: string, data: T): Promise<void> {
  const record: CacheRecord<T> = { v: 1, storedAt: Date.now(), data };
  memory.set(fullKey, { storedAt: record.storedAt, data: record.data as unknown });
  await AsyncStorage.setItem(fullKey, JSON.stringify(record));
}

export async function clearCached(fullKey: string): Promise<void> {
  memory.delete(fullKey);
  await AsyncStorage.removeItem(fullKey);
}
