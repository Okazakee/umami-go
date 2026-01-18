import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

type CacheIndexEntry = {
  fileUri: string;
  storedAt: number;
};

type CacheIndex = Record<string, CacheIndexEntry>;

const INDEX_KEY = '@umami-go:favicon-cache:index:v1';
const MAX_ENTRIES = 300;
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

let indexPromise: Promise<CacheIndex> | null = null;

function hashString(input: string): string {
  // Fast, deterministic (not cryptographic).
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

async function loadIndex(): Promise<CacheIndex> {
  if (indexPromise) return indexPromise;
  indexPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(INDEX_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as CacheIndex;
      if (!parsed || typeof parsed !== 'object') return {};
      return parsed;
    } catch {
      return {};
    }
  })();
  return indexPromise;
}

async function saveIndex(next: CacheIndex): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(next));
  indexPromise = Promise.resolve(next);
}

async function ensureDir(): Promise<string> {
  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? null;
  if (!base) throw new Error('No cache directory available.');
  const dir = `${base}favicons/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

async function fileExists(uri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
}

export async function getCachedFaviconUri(url: string, opts?: { ttlMs?: number }): Promise<string> {
  const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
  const key = url.trim();
  const now = Date.now();
  const idx = await loadIndex();
  const existing = idx[key];

  if (existing) {
    const isFresh = now - existing.storedAt <= ttlMs;
    if (isFresh && (await fileExists(existing.fileUri))) {
      return existing.fileUri;
    }
  }

  const dir = await ensureDir();
  const filename = `${hashString(key)}.png`;
  const localPath = `${dir}${filename}`;

  await FileSystem.downloadAsync(key, localPath);

  const next: CacheIndex = { ...idx, [key]: { fileUri: localPath, storedAt: now } };

  // Simple prune by oldest storedAt.
  const entries = Object.entries(next);
  if (entries.length > MAX_ENTRIES) {
    entries.sort((a, b) => a[1].storedAt - b[1].storedAt);
    const toRemove = entries.slice(0, entries.length - MAX_ENTRIES);
    for (const [removeKey, removeEntry] of toRemove) {
      delete next[removeKey];
      // Best-effort cleanup (ignore failures)
      void FileSystem.deleteAsync(removeEntry.fileUri, { idempotent: true }).catch(() => {});
    }
  }

  await saveIndex(next);
  return localPath;
}

export function prefetchFavicon(url: string): void {
  void getCachedFaviconUri(url).catch(() => {});
}
