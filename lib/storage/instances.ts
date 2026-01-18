import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getDb } from '../db/sqlite';

export type SetupType = 'self-hosted' | 'cloud';

export interface InstanceRecord {
  id: string;
  name: string;
  host: string;
  username: string | null;
  umamiUserId: string | null;
  setupType: SetupType;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number | null;
}

export interface InstanceSecrets {
  token?: string;
  apiKey?: string;
  /**
   * Self-hosted only.
   * Stored in SecureStore so we can re-login when the JWT expires/revokes.
   */
  password?: string;
}

const LEGACY_INSTANCE_KEY = '@umami-go:instance';

function tokenKey(instanceId: string) {
  // SecureStore keys must be alphanumeric / . - _
  return `umami_go_instance_${instanceId}_token`;
}

function apiKeyKey(instanceId: string) {
  return `umami_go_instance_${instanceId}_api_key`;
}

function passwordKey(instanceId: string) {
  return `umami_go_instance_${instanceId}_password`;
}

type InstanceRow = {
  id: string;
  name: string;
  host: string;
  username: string | null;
  umami_user_id: string | null;
  setup_type: SetupType;
  is_active: number;
  created_at: number;
  updated_at: number;
  last_used_at: number | null;
};

function mapRow(row: InstanceRow): InstanceRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    host: String(row.host),
    username: row.username ? String(row.username) : null,
    umamiUserId: row.umami_user_id ? String(row.umami_user_id) : null,
    setupType: row.setup_type as SetupType,
    isActive: Number(row.is_active) === 1,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    lastUsedAt: row.last_used_at === null ? null : Number(row.last_used_at),
  };
}

let didMigrateLegacy = false;

export async function migrateLegacyInstanceIfNeeded(): Promise<void> {
  if (didMigrateLegacy) return;
  didMigrateLegacy = true;

  const raw = await AsyncStorage.getItem(LEGACY_INSTANCE_KEY);
  if (!raw) return;

  try {
    const legacy = JSON.parse(raw) as {
      id?: string;
      name?: string;
      host?: string;
      setupType?: SetupType;
      token?: string;
      apiKey?: string;
    };

    if (!legacy.id || !legacy.name || !legacy.host || !legacy.setupType) {
      return;
    }

    await upsertInstance({
      id: legacy.id,
      name: legacy.name,
      host: legacy.host,
      setupType: legacy.setupType,
    });

    if (legacy.token) {
      await setInstanceSecrets(legacy.id, { token: legacy.token });
    }
    if (legacy.apiKey) {
      await setInstanceSecrets(legacy.id, { apiKey: legacy.apiKey });
    }

    // Clear legacy storage once migrated
    await AsyncStorage.removeItem(LEGACY_INSTANCE_KEY);
  } catch {
    // ignore
  }
}

export async function upsertInstance(input: {
  id: string;
  name: string;
  host: string;
  username?: string | null;
  umamiUserId?: string | null;
  setupType: SetupType;
  makeActive?: boolean;
}): Promise<void> {
  const db = await getDb();
  const now = Date.now();

  await db.runAsync(
    `
    INSERT INTO instances (id, name, host, username, umami_user_id, setup_type, is_active, created_at, updated_at, last_used_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      host = excluded.host,
      username = excluded.username,
      umami_user_id = excluded.umami_user_id,
      setup_type = excluded.setup_type,
      updated_at = excluded.updated_at
  `,
    [
      input.id,
      input.name,
      input.host,
      input.username ?? null,
      input.umamiUserId ?? null,
      input.setupType,
      input.makeActive ? 1 : 0,
      now,
      now,
      now,
    ]
  );

  if (input.makeActive) {
    await setActiveInstance(input.id);
  }
}

export async function setActiveInstance(instanceId: string): Promise<void> {
  const db = await getDb();
  const now = Date.now();

  // Ensure only one active instance
  await db.runAsync('UPDATE instances SET is_active = 0 WHERE is_active = 1');
  await db.runAsync(
    'UPDATE instances SET is_active = 1, last_used_at = ?, updated_at = ? WHERE id = ?',
    [now, now, instanceId]
  );
}

export async function listInstances(): Promise<InstanceRecord[]> {
  await migrateLegacyInstanceIfNeeded();

  const db = await getDb();
  const rows = await db.getAllAsync<InstanceRow>(
    'SELECT id, name, host, username, umami_user_id, setup_type, is_active, created_at, updated_at, last_used_at FROM instances ORDER BY is_active DESC, last_used_at DESC, created_at DESC'
  );
  return rows.map(mapRow);
}

export async function getActiveInstance(): Promise<InstanceRecord | null> {
  await migrateLegacyInstanceIfNeeded();

  const db = await getDb();
  const row = await db.getFirstAsync<InstanceRow>(
    'SELECT id, name, host, username, umami_user_id, setup_type, is_active, created_at, updated_at, last_used_at FROM instances WHERE is_active = 1 LIMIT 1'
  );
  return row ? mapRow(row) : null;
}

export async function getInstanceById(instanceId: string): Promise<InstanceRecord | null> {
  await migrateLegacyInstanceIfNeeded();

  const db = await getDb();
  const row = await db.getFirstAsync<InstanceRow>(
    'SELECT id, name, host, username, umami_user_id, setup_type, is_active, created_at, updated_at, last_used_at FROM instances WHERE id = ? LIMIT 1',
    [instanceId]
  );
  return row ? mapRow(row) : null;
}

export async function getInstanceSecrets(instanceId: string): Promise<InstanceSecrets> {
  const [token, apiKey, password] = await Promise.all([
    SecureStore.getItemAsync(tokenKey(instanceId)),
    SecureStore.getItemAsync(apiKeyKey(instanceId)),
    SecureStore.getItemAsync(passwordKey(instanceId)),
  ]);
  return {
    token: token ?? undefined,
    apiKey: apiKey ?? undefined,
    password: password ?? undefined,
  };
}

export async function setInstanceSecrets(
  instanceId: string,
  secrets: InstanceSecrets
): Promise<void> {
  const ops: Promise<void>[] = [];

  if (secrets.token !== undefined) {
    if (secrets.token) ops.push(SecureStore.setItemAsync(tokenKey(instanceId), secrets.token));
    else ops.push(SecureStore.deleteItemAsync(tokenKey(instanceId)));
  }

  if (secrets.apiKey !== undefined) {
    if (secrets.apiKey) ops.push(SecureStore.setItemAsync(apiKeyKey(instanceId), secrets.apiKey));
    else ops.push(SecureStore.deleteItemAsync(apiKeyKey(instanceId)));
  }

  if (secrets.password !== undefined) {
    if (secrets.password)
      ops.push(SecureStore.setItemAsync(passwordKey(instanceId), secrets.password));
    else ops.push(SecureStore.deleteItemAsync(passwordKey(instanceId)));
  }

  await Promise.all(ops);
}

export async function clearAllInstances(): Promise<void> {
  const db = await getDb();
  const instances = await listInstances();

  await db.runAsync('DELETE FROM instances');

  // Best-effort secret cleanup
  await Promise.all(
    instances.flatMap((i) => [
      SecureStore.deleteItemAsync(tokenKey(i.id)),
      SecureStore.deleteItemAsync(apiKeyKey(i.id)),
      SecureStore.deleteItemAsync(passwordKey(i.id)),
    ])
  );

  await AsyncStorage.removeItem(LEGACY_INSTANCE_KEY);
}

export async function deleteInstance(instanceId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM instances WHERE id = ?', [instanceId]);
  // Best-effort secret cleanup
  await Promise.all([
    SecureStore.deleteItemAsync(tokenKey(instanceId)),
    SecureStore.deleteItemAsync(apiKeyKey(instanceId)),
    SecureStore.deleteItemAsync(passwordKey(instanceId)),
  ]);
}
