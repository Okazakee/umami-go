import { getDb } from '@/lib/db/sqlite';

type CacheRecord<T> = {
  v: 1;
  storedAt: number;
  data: T;
};

const PREFIX = '@umami-go:cache:';
const memory = new Map<string, { storedAt: number; data: unknown }>();

// expo-sqlite can throw "database is locked" if multiple writes happen concurrently
// (e.g. multiple parallel fetches finishing at the same time). Serialize all writes.
let writeQueue: Promise<void> = Promise.resolve();
function enqueueWrite(fn: () => Promise<void>): Promise<void> {
  const next = writeQueue.then(fn, fn);
  // Keep the queue alive even if one write fails.
  writeQueue = next.catch(() => undefined);
  return next;
}

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

  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{ stored_at: number; data_json: string }>(
      'SELECT stored_at, data_json FROM cache_entries WHERE key = ?',
      [fullKey]
    );
    if (!row || typeof row.stored_at !== 'number' || typeof row.data_json !== 'string') return null;
    const data = JSON.parse(row.data_json) as T;
    memory.set(fullKey, { storedAt: row.stored_at, data: data as unknown });
    return { v: 1, storedAt: row.stored_at, data };
  } catch {
    return null;
  }
}

export async function setCached<T>(fullKey: string, data: T): Promise<void> {
  const storedAt = Date.now();
  memory.set(fullKey, { storedAt, data: data as unknown });
  await enqueueWrite(async () => {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO cache_entries (key, stored_at, data_json) VALUES (?, ?, ?)',
      [fullKey, storedAt, JSON.stringify(data)]
    );
  });
}

export async function clearCached(fullKey: string): Promise<void> {
  memory.delete(fullKey);
  await enqueueWrite(async () => {
    const db = await getDb();
    await db.runAsync('DELETE FROM cache_entries WHERE key = ?', [fullKey]);
  });
}

export async function clearAllCached(): Promise<void> {
  memory.clear();
  try {
    await enqueueWrite(async () => {
      const db = await getDb();
      await db.runAsync('DELETE FROM cache_entries WHERE key LIKE ?', [`${PREFIX}%`]);
    });
  } catch {
    // ignore
  }
}
