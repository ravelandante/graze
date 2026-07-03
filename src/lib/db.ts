import Database from "@tauri-apps/plugin-sql";
import type { Collection, Recording } from "../types";

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (db) return db;
  db = await Database.load("sqlite:graze.db");
  await migrate(db);
  return db;
}

async function migrate(db: Database) {
  const cols = await db.select<{ name: string }[]>(
    "PRAGMA table_info(recordings)",
  );
  if (!cols.some((c) => c.name === "peaks")) {
    await db.execute("ALTER TABLE recordings ADD COLUMN peaks TEXT");
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS recordings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT UNIQUE NOT NULL,
      file_name TEXT NOT NULL,
      title TEXT,
      artist TEXT,
      comment TEXT,
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
    USING fts5(title, artist, comment, originator, file_name, content=recordings, content_rowid=id)
  `);
}

export async function fetchRecordings(): Promise<Recording[]> {
  const d = await getDb();
  return d.select<Recording[]>(`
    SELECT
      id, title, artist, comment, originator, channels, format,
      file_path             as filePath,
      file_name             as fileName,
      originator_reference  as originatorReference,
      time_reference        as timeReference,
      bwf_description       as bwfDescription,
      recorded_at           as recordedAt,
      duration_seconds      as durationSeconds,
      sample_rate           as sampleRate,
      bit_depth             as bitDepth,
      file_size_bytes       as fileSizeBytes,
      imported_at           as importedAt
    FROM recordings ORDER BY imported_at DESC
  `);
}

export type RecordingInsert = Omit<Recording, "id" | "importedAt">;

export async function insertRecording(r: RecordingInsert): Promise<void> {
  const d = await getDb();
  await d.execute(
    `INSERT OR IGNORE INTO recordings
      (file_path, file_name, title, artist, comment, originator, originator_reference,
       time_reference, bwf_description, recorded_at, duration_seconds, sample_rate,
       bit_depth, channels, format)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      r.filePath,
      r.fileName,
      r.title,
      r.artist,
      r.comment,
      r.originator,
      r.originatorReference,
      r.timeReference,
      r.bwfDescription,
      r.recordedAt,
      r.durationSeconds,
      r.sampleRate,
      r.bitDepth,
      r.channels,
      r.format,
    ],
  );
}

export async function updateRecording(
  id: number,
  fields: { title: string | null; comment: string | null },
): Promise<void> {
  const d = await getDb();
  await d.execute("UPDATE recordings SET title=?, comment=? WHERE id=?", [
    fields.title,
    fields.comment,
    id,
  ]);
}

export async function fetchCollections(): Promise<Collection[]> {
  const d = await getDb();
  return d.select<Collection[]>("SELECT * FROM collections ORDER BY name");
}

export async function insertCollection(name: string): Promise<void> {
  const d = await getDb();
  await d.execute("INSERT INTO collections (name) VALUES (?)", [name]);
}

export async function deleteCollection(id: number): Promise<void> {
  const d = await getDb();
  await d.execute("DELETE FROM collections WHERE id = ?", [id]);
}

export async function renameCollection(id: number, name: string): Promise<void> {
  const d = await getDb();
  await d.execute("UPDATE collections SET name = ? WHERE id = ?", [name, id]);
}

export async function fetchMemberships(): Promise<Map<number, Set<number>>> {
  const d = await getDb();
  const rows = await d.select<
    { collection_id: number; recording_id: number }[]
  >("SELECT collection_id, recording_id FROM recording_collections");
  const map = new Map<number, Set<number>>();
  for (const { collection_id, recording_id } of rows) {
    if (!map.has(collection_id)) map.set(collection_id, new Set());
    map.get(collection_id)!.add(recording_id);
  }
  return map;
}

export async function addRecordingToCollection(
  recordingId: number,
  collectionId: number,
): Promise<void> {
  const d = await getDb();
  await d.execute(
    "INSERT OR IGNORE INTO recording_collections (recording_id, collection_id) VALUES (?, ?)",
    [recordingId, collectionId],
  );
}

export async function getExistingPeaks(): Promise<Map<number, number[][]>> {
  const d = await getDb();
  const rows = await d.select<{ id: number; peaks: string }[]>(
    "SELECT id, peaks FROM recordings WHERE peaks IS NOT NULL",
  );
  const map = new Map<number, number[][]>();
  for (const { id, peaks } of rows) {
    try {
      map.set(id, JSON.parse(peaks));
    } catch {
      // skip rows with malformed peaks JSON
    }
  }
  return map;
}

export async function savePeaks(id: number, peaks: number[][]): Promise<void> {
  const d = await getDb();
  await d.execute("UPDATE recordings SET peaks = ? WHERE id = ?", [
    JSON.stringify(peaks),
    id,
  ]);
}

export async function removeRecordingFromCollection(
  recordingId: number,
  collectionId: number,
): Promise<void> {
  const d = await getDb();
  await d.execute(
    "DELETE FROM recording_collections WHERE recording_id = ? AND collection_id = ?",
    [recordingId, collectionId],
  );
}
