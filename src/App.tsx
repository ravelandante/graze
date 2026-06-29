import { useEffect, useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getDb } from "./lib/db";
import { extractMetadata } from "./lib/metadata";
import { normalizeFile, trimFile, writeFileMetadata } from "./lib/audio";
import { CollectionSidebar } from "./components/CollectionSidebar";
import { RecordingList } from "./components/RecordingList";
import { RecordingDetail } from "./components/RecordingDetail";
import type { Collection, Recording } from "./types";

export default function App() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedRecordingId, setSelectedRecordingId] = useState<number | null>(
    null,
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    number | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const selectedRecording =
    recordings.find((r) => r.id === selectedRecordingId) ?? null;

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const db = await getDb();
    const recs = await db.select<Recording[]>(`
      SELECT
        id, title, artist, comment, notes, originator, channels, format,
        file_path        as filePath,
        file_name        as fileName,
        originator_reference  as originatorReference,
        time_reference   as timeReference,
        bwf_description  as bwfDescription,
        recorded_at      as recordedAt,
        duration_seconds as durationSeconds,
        sample_rate      as sampleRate,
        bit_depth        as bitDepth,
        file_size_bytes  as fileSizeBytes,
        imported_at      as importedAt
      FROM recordings ORDER BY imported_at DESC
    `);
    const cols = await db.select<Collection[]>(
      "SELECT * FROM collections ORDER BY name",
    );
    setRecordings(recs);
    setCollections(cols);
  }

  const visibleRecordings = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return recordings;
    return recordings.filter((r) =>
      r.fileName?.toLowerCase().includes(q) ||
      r.title?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q) ||
      r.notes?.toLowerCase().includes(q) ||
      r.originator?.toLowerCase().includes(q)
    );
  }, [recordings, searchQuery]);

  async function handleImport() {
    const paths = await open({
      multiple: true,
      filters: [{ name: "Audio", extensions: ["wav", "mp3"] }],
    });
    if (!paths) return;

    const pathList = Array.isArray(paths) ? paths : [paths];
    setStatus(`Importing ${pathList.length} file(s)…`);

    const db = await getDb();
    for (const filePath of pathList) {
      try {
        const meta = await extractMetadata(filePath);
        await db.execute(
          `INSERT OR IGNORE INTO recordings
            (file_path, file_name, title, artist, comment, originator, originator_reference,
             time_reference, bwf_description, recorded_at, duration_seconds, sample_rate,
             bit_depth, channels, format)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            meta.filePath,
            meta.fileName,
            meta.title,
            meta.artist,
            meta.comment,
            meta.originator,
            meta.originatorReference,
            meta.timeReference,
            meta.bwfDescription,
            meta.recordedAt,
            meta.durationSeconds,
            meta.sampleRate,
            meta.bitDepth,
            meta.channels,
            meta.format,
          ],
        );
      } catch (err) {
        console.error("Failed to import", filePath, err);
      }
    }

    setStatus(null);
    await loadAll();
  }

  async function handleSaveRecording(updates: Partial<Recording>) {
    if (!selectedRecordingId || !selectedRecording) return;
    setStatus("Saving…");
    try {
      await writeFileMetadata(selectedRecording.filePath, {
        title: updates.title,
        comment: updates.comment,
      });
    } catch (err) {
      setStatus("File write failed: " + String(err));
      setTimeout(() => setStatus(null), 5000);
      return;
    }
    const db = await getDb();
    await db.execute(
      "UPDATE recordings SET title=?, comment=?, notes=? WHERE id=?",
      [updates.title ?? null, updates.comment ?? null, updates.notes ?? null, selectedRecordingId],
    );
    setStatus(null);
    await loadAll();
  }

  async function handleNormalize() {
    if (!selectedRecording) return;
    const outPath = selectedRecording.filePath.replace(
      /(\.\w+)$/,
      "_normalized$1",
    );
    setStatus("Normalizing…");
    try {
      await normalizeFile(selectedRecording.filePath, outPath);
      setStatus("Normalized → " + outPath.split("/").pop());
    } catch (err) {
      setStatus("Normalize failed: " + String(err));
    }
    setTimeout(() => setStatus(null), 4000);
  }

  async function handleTrim(start: number, end: number) {
    if (!selectedRecording) return;
    const outPath = selectedRecording.filePath.replace(
      /(\.\w+)$/,
      `_trim${start}-${end}$1`,
    );
    setStatus("Trimming…");
    try {
      await trimFile(selectedRecording.filePath, outPath, start, end);
      setStatus("Trimmed → " + outPath.split("/").pop());
    } catch (err) {
      setStatus("Trim failed: " + String(err));
    }
    setTimeout(() => setStatus(null), 4000);
  }

  async function handleCreateCollection(name: string) {
    const db = await getDb();
    await db.execute("INSERT INTO collections (name) VALUES (?)", [name]);
    await loadAll();
  }

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      <CollectionSidebar
        collections={collections}
        selectedId={selectedCollectionId}
        onSelect={setSelectedCollectionId}
        onCreate={handleCreateCollection}
      />

      <RecordingList
        recordings={visibleRecordings}
        selectedId={selectedRecordingId}
        onSelect={setSelectedRecordingId}
        onImport={handleImport}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {status && (
          <div className="px-4 py-2 bg-zinc-800 text-xs text-zinc-300 border-b border-zinc-700">
            {status}
          </div>
        )}
        {selectedRecording ? (
          <RecordingDetail
            key={selectedRecording.id}
            recording={selectedRecording}
            onSave={handleSaveRecording}
            onNormalize={handleNormalize}
            onTrim={handleTrim}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
            Select a recording
          </div>
        )}
      </main>
    </div>
  );
}
