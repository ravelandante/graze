import { useEffect, useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  addRecordingToCollection,
  removeRecordingFromCollection,
  deleteCollection,
  renameCollection,
  fetchCollections,
  fetchMemberships,
  fetchRecordings,
  insertCollection,
  insertRecording,
  updateRecording,
} from "./lib/db";
import { extractMetadata } from "./lib/metadata";
import { normalizeFile, trimFile, writeFileMetadata } from "./lib/audio";
import { CollectionSidebar } from "./components/CollectionSidebar";
import { RecordingList } from "./components/RecordingList";
import { RecordingDetail } from "./components/RecordingDetail";
import { Playbar } from "./components/Playbar";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import type { Collection, Recording } from "./types";

export default function App() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [memberships, setMemberships] = useState<Map<number, Set<number>>>(
    new Map(),
  );
  const [selectedRecordingId, setSelectedRecordingId] = useState<number | null>(
    null,
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    number | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [listRatio, setListRatio] = useState(() => {
    const saved = parseFloat(localStorage.getItem("listRatio") ?? "");
    return Number.isFinite(saved) ? saved : 288 / window.innerWidth;
  });
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);

  const selectedRecording =
    recordings.find((r) => r.id === selectedRecordingId) ?? null;

  useEffect(() => {
    loadAll();
    function onResize() { setWindowWidth(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const listWidth = Math.round(windowWidth * listRatio);

  async function loadAll() {
    const [recs, cols, mems] = await Promise.all([
      fetchRecordings(),
      fetchCollections(),
      fetchMemberships(),
    ]);
    setRecordings(recs);
    setCollections(cols);
    setMemberships(mems);
  }

  const recordingMemberships = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const [collectionId, recordingIds] of memberships) {
      for (const recordingId of recordingIds) {
        if (!map.has(recordingId)) map.set(recordingId, new Set());
        map.get(recordingId)!.add(collectionId);
      }
    }
    return map;
  }, [memberships]);

  const visibleRecordings = useMemo(() => {
    const collectionIds =
      selectedCollectionId !== null
        ? (memberships.get(selectedCollectionId) ?? new Set<number>())
        : null;
    const q = searchQuery.toLowerCase();
    return recordings.filter((r) => {
      if (collectionIds && !collectionIds.has(r.id)) return false;
      if (!q) return true;
      return (
        r.fileName?.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q) ||
        r.originator?.toLowerCase().includes(q)
      );
    });
  }, [recordings, memberships, selectedCollectionId, searchQuery]);

  const {
    isPlaying,
    isLooping,
    isAutoAdvance,
    togglePlay,
    stop,
    playNext,
    toggleLoop,
    toggleAutoAdvance,
    audioEl,
  } = useAudioPlayer(
    visibleRecordings,
    selectedRecordingId,
    setSelectedRecordingId,
  );

  async function handleImport() {
    const paths = await open({
      multiple: true,
      filters: [{ name: "Audio", extensions: ["wav", "mp3"] }],
    });
    if (!paths) return;

    const pathList = Array.isArray(paths) ? paths : [paths];
    setStatus(`Importing ${pathList.length} file(s)…`);

    for (const filePath of pathList) {
      try {
        const meta = await extractMetadata(filePath);
        await insertRecording(meta);
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
    await updateRecording(selectedRecordingId, {
      title: updates.title ?? null,
      comment: updates.comment ?? null,
    });
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
    await insertCollection(name);
    await loadAll();
  }

  async function handleRenameCollection(id: number, name: string) {
    await renameCollection(id, name);
    await loadAll();
  }

  async function handleDeleteCollection(id: number) {
    if (selectedCollectionId === id) setSelectedCollectionId(null);
    await deleteCollection(id);
    await loadAll();
  }

  function startResize(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = Math.round(window.innerWidth * listRatio);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    let lastRatio = listRatio;
    function onMouseMove(ev: MouseEvent) {
      const w = window.innerWidth;
      const newWidth = Math.max(
        150,
        Math.min(Math.round(w * 0.6), startWidth + ev.clientX - startX),
      );
      lastRatio = newWidth / w;
      setListRatio(lastRatio);
    }
    function onMouseUp() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      localStorage.setItem("listRatio", String(lastRatio));
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  async function handleToggleCollection(
    recordingId: number,
    collectionId: number,
    isMember: boolean,
  ) {
    if (isMember) {
      await removeRecordingFromCollection(recordingId, collectionId);
    } else {
      await addRecordingToCollection(recordingId, collectionId);
    }
    await loadAll();
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-white overflow-hidden">
      <div className="flex flex-1 min-h-0">
        <CollectionSidebar
          collections={collections}
          selectedId={selectedCollectionId}
          onSelect={setSelectedCollectionId}
          onCreate={handleCreateCollection}
          onRename={handleRenameCollection}
          onDelete={handleDeleteCollection}
        />
        <div
          style={{ width: listWidth }}
          className="shrink-0 h-full flex flex-col"
        >
          <RecordingList
            recordings={visibleRecordings}
            selectedId={selectedRecordingId}
            onSelect={setSelectedRecordingId}
            onImport={handleImport}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            collections={collections}
            memberships={recordingMemberships}
            onToggleCollection={handleToggleCollection}
          />
        </div>
        <div
          onMouseDown={startResize}
          className="w-1 shrink-0 cursor-col-resize bg-zinc-800 hover:bg-zinc-600 transition-colors select-none"
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
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
              Select a recording
            </div>
          )}
        </main>
      </div>
      <Playbar
        recording={selectedRecording}
        audioEl={audioEl}
        isPlaying={isPlaying}
        isLooping={isLooping}
        isAutoAdvance={isAutoAdvance}
        onTogglePlay={togglePlay}
        onStop={stop}
        onNext={playNext}
        onToggleLoop={toggleLoop}
        onToggleAutoAdvance={toggleAutoAdvance}
        onTrim={handleTrim}
      />
    </div>
  );
}
