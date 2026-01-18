import * as SQLite from 'expo-sqlite';

// Single DB for the app
const DB_NAME = 'umami-go.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let didInit = false;

async function ensureSchema(db: SQLite.SQLiteDatabase) {
  // Minimal schema for now; evolve with migrations later.
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS instances (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      username TEXT,
      umami_user_id TEXT,
      setup_type TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_used_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_instances_is_active ON instances(is_active);
    CREATE INDEX IF NOT EXISTS idx_instances_last_used_at ON instances(last_used_at);
  `);

  // Best-effort column adds for existing installs
  try {
    await db.execAsync('ALTER TABLE instances ADD COLUMN username TEXT');
  } catch {
    // ignore
  }

  try {
    await db.execAsync('ALTER TABLE instances ADD COLUMN umami_user_id TEXT');
  } catch {
    // ignore
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
