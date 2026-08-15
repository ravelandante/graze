import Database from "@tauri-apps/plugin-sql";
import type { Collection, Recording, RecordingStatus } from "@types";

let db: Database | null = null;

async function getDb(): Promise<Database> {
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
      peaks TEXT,
      status TEXT NOT NULL DEFAULT 'present',
      imported_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Column back-fills for databases created before peaks/status existed.
  const cols = await db.select<{ name: string }[]>(
    "PRAGMA table_info(recordings)",
  );
  if (!cols.some((c) => c.name === "peaks")) {
    await db.execute("ALTER TABLE recordings ADD COLUMN peaks TEXT");
  }
  if (!cols.some((c) => c.name === "status")) {
    await db.execute(
      "ALTER TABLE recordings ADD COLUMN status TEXT NOT NULL DEFAULT 'present'",
    );
    if (cols.some((c) => c.name === "missing")) {
      await db.execute(
        "UPDATE recordings SET status = 'missing' WHERE missing = 1",
      );
    }
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS watched_folders (
      path TEXT PRIMARY KEY NOT NULL
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
    CREATE TABLE IF NOT EXISTS recording_edits (
      recording_id INTEGER PRIMARY KEY
        REFERENCES recordings(id) ON DELETE CASCADE,
      trim_start REAL,
      trim_end   REAL
    )
  `);

  // recordings_fts was created here historically but never populated or
  // queried (search filters in JS), so clean it out of existing databases.
  await db.execute("DROP TABLE IF EXISTS recordings_fts");
}

export async function fetchRecordings(): Promise<Recording[]> {
  const d = await getDb();
  return d.select<Recording[]>(`
    SELECT
      id, title, artist, comment, originator, channels, format, status,
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
      imported_at           as importedAt,
      e.trim_start          as trimStart,
      e.trim_end            as trimEnd
    FROM recordings
    LEFT JOIN recording_edits e ON e.recording_id = recordings.id
    ORDER BY imported_at DESC
  `);
}

export type RecordingInsert = Omit<
  Recording,
  "id" | "importedAt" | "status" | "trimStart" | "trimEnd"
>;

export async function upsertRecordingEdits(
  recordingId: number,
  edits: { trimStart: number | null; trimEnd: number | null },
): Promise<void> {
  const d = await getDb();
  await d.execute(
    `INSERT INTO recording_edits (recording_id, trim_start, trim_end)
     VALUES (?, ?, ?)
     ON CONFLICT(recording_id) DO UPDATE
       SET trim_start = excluded.trim_start, trim_end = excluded.trim_end`,
    [recordingId, edits.trimStart, edits.trimEnd],
  );
}

export async function insertRecording(r: RecordingInsert): Promise<void> {
  const d = await getDb();
  await d.execute(
    `INSERT OR IGNORE INTO recordings
      (file_path, file_name, title, artist, comment, originator, originator_reference,
       time_reference, bwf_description, recorded_at, duration_seconds, sample_rate,
       bit_depth, channels, format, file_size_bytes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      r.fileSizeBytes,
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

export async function renameCollection(
  id: number,
  name: string,
): Promise<void> {
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

export async function fetchPeaksIds(): Promise<Set<number>> {
  const d = await getDb();
  const rows = await d.select<{ id: number }[]>(
    "SELECT id FROM recordings WHERE peaks IS NOT NULL",
  );
  return new Set(rows.map((r) => r.id));
}

export async function fetchPeaks(id: number): Promise<number[][] | null> {
  const d = await getDb();
  const rows = await d.select<{ peaks: string }[]>(
    "SELECT peaks FROM recordings WHERE id = ? AND peaks IS NOT NULL",
    [id],
  );
  if (rows.length === 0) return null;
  try {
    return JSON.parse(rows[0].peaks) as number[][];
  } catch {
    return null; // malformed peaks JSON — treat as absent so it gets recomputed
  }
}

export async function savePeaks(id: number, peaks: number[][]): Promise<void> {
  const d = await getDb();
  await d.execute("UPDATE recordings SET peaks = ? WHERE id = ?", [
    JSON.stringify(peaks),
    id,
  ]);
}

export async function deleteRecording(id: number): Promise<void> {
  const d = await getDb();
  await d.execute("DELETE FROM recordings WHERE id = ?", [id]);
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

export async function setRecordingsStatus(
  ids: number[],
  status: RecordingStatus,
): Promise<void> {
  if (ids.length === 0) return;
  const d = await getDb();
  const placeholders = ids.map(() => "?").join(",");
  await d.execute(
    `UPDATE recordings SET status = ? WHERE id IN (${placeholders})`,
    [status, ...ids],
  );
}

export async function setRecordingsStatusByPath(
  paths: string[],
  status: RecordingStatus,
): Promise<void> {
  if (paths.length === 0) return;
  const d = await getDb();
  const placeholders = paths.map(() => "?").join(",");
  await d.execute(
    `UPDATE recordings SET status = ? WHERE file_path IN (${placeholders})`,
    [status, ...paths],
  );
}

export async function fetchWatchedFolders(): Promise<string[]> {
  const d = await getDb();
  const rows = await d.select<{ path: string }[]>(
    "SELECT path FROM watched_folders",
  );
  return rows.map((r) => r.path);
}

export async function insertWatchedFolder(path: string): Promise<void> {
  const d = await getDb();
  await d.execute("INSERT OR IGNORE INTO watched_folders (path) VALUES (?)", [
    path,
  ]);
}

export async function deleteWatchedFolder(path: string): Promise<void> {
  const d = await getDb();
  await d.execute("DELETE FROM watched_folders WHERE path = ?", [path]);
}
