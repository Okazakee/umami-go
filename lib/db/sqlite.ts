import * as SQLite from 'expo-sqlite';

// Single DB for the app
const DB_NAME = 'umami-go.db';
const LATEST_SCHEMA_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let didInit = false;

async function ensureSchema(db: SQLite.SQLiteDatabase) {
  // Base pragmas
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  if (current < 1) {
    // v1: analytics cache store
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cache_entries (
        key TEXT PRIMARY KEY NOT NULL,
        stored_at INTEGER NOT NULL,
        data_json TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_cache_entries_stored_at ON cache_entries(stored_at);
    `);

    // Remove legacy table if present.
    try {
      await db.execAsync('DROP TABLE IF EXISTS instances;');
    } catch {
      // ignore
    }

    await db.execAsync('PRAGMA user_version = 1;');
  }

  if (current > LATEST_SCHEMA_VERSION) {
    // Future-proofing: app downgraded. Keep running with latest known schema.
    // We intentionally do nothing here.
  }
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }

  const db = await dbPromise;

  if (!didInit) {
    didInit = true;
    await ensureSchema(db);
  }

  return db;
}
