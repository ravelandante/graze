import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;
  db = await Database.load("sqlite:graze.db");
  await migrate(db);
  return db;
}

async function migrate(db: Database) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS recordings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT UNIQUE NOT NULL,
      file_name TEXT NOT NULL,
      title TEXT,
      artist TEXT,
      comment TEXT,
      notes TEXT,
      originator TEXT,
      originator_reference TEXT,
      time_reference INTEGER,
      bwf_description TEXT,
      recorded_at TEXT,
      duration_seconds REAL,
      sample_rate INTEGER,
      bit_depth INTEGER,
      channels INTEGER,
      format TEXT,
      file_size_bytes INTEGER,
      imported_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS recording_collections (
      recording_id INTEGER NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
      collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      PRIMARY KEY (recording_id, collection_id)
    )
  `);

  await db.execute(`
    CREATE VIRTUAL TABLE IF NOT EXISTS recordings_fts
    USING fts5(title, artist, comment, notes, originator, file_name, content=recordings, content_rowid=id)
  `);
}
