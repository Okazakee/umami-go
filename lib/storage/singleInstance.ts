import {
  type InstanceSecrets,
  getActiveInstance,
  getInstanceSecrets,
  listInstances,
} from '@/lib/storage/instances';
import { clearAllInstances } from '@/lib/storage/instances';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export type SetupType = 'self-hosted' | 'cloud';

export interface SingleInstanceRecord {
  name: string;
  host: string;
  username: string | null;
  umamiUserId: string | null;
  setupType: SetupType;
  createdAt: number;
  updatedAt: number;
}

const SINGLE_INSTANCE_KEY = '@umami-go:single-instance';

// SecureStore keys must be alphanumeric / . - _
const TOKEN_KEY = 'umami_go_single_token';
const API_KEY_KEY = 'umami_go_single_api_key';
const PASSWORD_KEY = 'umami_go_single_password';

let didMigrateLegacy = false;

export async function getInstance(): Promise<SingleInstanceRecord | null> {
  const raw = await AsyncStorage.getItem(SINGLE_INSTANCE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SingleInstanceRecord;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.host || !parsed.setupType) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setInstance(
  input: Omit<SingleInstanceRecord, 'createdAt' | 'updatedAt'> & {
    createdAt?: number;
  }
): Promise<void> {
  const now = Date.now();
  const createdAt = input.createdAt ?? now;
  const record: SingleInstanceRecord = {
    name: input.name,
    host: input.host,
    username: input.username ?? null,
    umamiUserId: input.umamiUserId ?? null,
    setupType: input.setupType,
    createdAt,
    updatedAt: now,
  };
  await AsyncStorage.setItem(SINGLE_INSTANCE_KEY, JSON.stringify(record));
}

export async function clearInstance(): Promise<void> {
  await AsyncStorage.removeItem(SINGLE_INSTANCE_KEY);
}

export async function getSecrets(): Promise<InstanceSecrets> {
  const [token, apiKey, password] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(API_KEY_KEY),
    SecureStore.getItemAsync(PASSWORD_KEY),
  ]);
  return {
    token: token ?? undefined,
    apiKey: apiKey ?? undefined,
    password: password ?? undefined,
  };
}

export async function setSecrets(secrets: InstanceSecrets): Promise<void> {
  const ops: Promise<void>[] = [];

  if (secrets.token !== undefined) {
    if (secrets.token) ops.push(SecureStore.setItemAsync(TOKEN_KEY, secrets.token));
    else ops.push(SecureStore.deleteItemAsync(TOKEN_KEY));
  }

  if (secrets.apiKey !== undefined) {
    if (secrets.apiKey) ops.push(SecureStore.setItemAsync(API_KEY_KEY, secrets.apiKey));
    else ops.push(SecureStore.deleteItemAsync(API_KEY_KEY));
  }

  if (secrets.password !== undefined) {
    if (secrets.password) ops.push(SecureStore.setItemAsync(PASSWORD_KEY, secrets.password));
    else ops.push(SecureStore.deleteItemAsync(PASSWORD_KEY));
  }

  await Promise.all(ops);
}

export async function clearSecrets(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(API_KEY_KEY),
    SecureStore.deleteItemAsync(PASSWORD_KEY),
  ]);
}

/**
 * One-time migration for existing installs that used multi-instance storage.
 * Picks the active instance (fallback: first by list order), copies it into the
 * single-instance store, then clears legacy instances + secrets.
 */
export async function migrateLegacyInstancesToSingleIfNeeded(): Promise<void> {
  if (didMigrateLegacy) return;
  didMigrateLegacy = true;

  const existing = await getInstance();
  if (existing) return;

  const active = await getActiveInstance();
  const legacy = active ?? (await listInstances())[0] ?? null;
  if (!legacy) return;

  const secrets = await getInstanceSecrets(legacy.id);
  const now = Date.now();

  await setInstance({
    name: legacy.name,
    host: legacy.host,
    username: legacy.username,
    umamiUserId: legacy.umamiUserId,
    setupType: legacy.setupType,
    createdAt: legacy.createdAt ?? now,
  });
  await setSecrets(secrets);

  // After copying, clear legacy storage so the app doesn't “remember” multiple instances.
  await clearAllInstances();
}
