import { useEffect, useMemo, useState } from "react";
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  usePanelRef,
} from "react-resizable-panels";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import { readDir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
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

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "graze-main",
    storage: localStorage,
  });

  const detailPanelRef = usePanelRef();
  const [isDetailCollapsed, setIsDetailCollapsed] = useState(false);

  const selectedRecording =
    recordings.find((r) => r.id === selectedRecordingId) ?? null;

  useEffect(() => {
    loadAll();
  }, []);

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
    currentTime,
    togglePlay,
    stop,
    playNext,
    toggleLoop,
    toggleAutoAdvance,
    toggleAutoplay,
    isAutoplay,
    audioEl,
  } = useAudioPlayer(
    visibleRecordings,
    selectedRecordingId,
    setSelectedRecordingId,
  );

  async function importPaths(filePaths: string[]) {
    setStatus(`Importing ${filePaths.length} file(s)…`);
    for (const filePath of filePaths) {
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

  async function handleImport() {
    const paths = await open({
      multiple: true,
      filters: [{ name: "Audio", extensions: ["wav", "mp3"] }],
    });
    if (!paths) return;
    await importPaths(Array.isArray(paths) ? paths : [paths]);
  }

  async function handleImportFolder() {
    const folder = await open({ directory: true });
    if (!folder || typeof folder !== "string") return;
    const entries = await readDir(folder);
    const filePaths = await Promise.all(
      entries
        .filter((e) => e.isFile && /\.(wav|mp3)$/i.test(e.name))
        .map((e) => join(folder, e.name)),
    );
    if (filePaths.length === 0) {
      setStatus("No audio files found in folder");
      setTimeout(() => setStatus(null), 3000);
      return;
    }
    await importPaths(filePaths);
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
        <Group
          orientation="horizontal"
          defaultLayout={defaultLayout}
          onLayoutChanged={onLayoutChanged}
          className="flex-1 min-h-0"
        >
          <Panel
            id="list"
            defaultSize={25}
            minSize={12}
            className="flex flex-col"
          >
            <RecordingList
              recordings={visibleRecordings}
              selectedId={selectedRecordingId}
              onSelect={setSelectedRecordingId}
              onImport={handleImport}
              onImportFolder={handleImportFolder}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              collections={collections}
              memberships={recordingMemberships}
              onToggleCollection={handleToggleCollection}
            />
          </Panel>
          <Separator className="relative w-1 bg-zinc-800 hover:bg-zinc-600 transition-colors cursor-col-resize overflow-visible">
            <button
              onClick={(e) => {
                e.stopPropagation();
                isDetailCollapsed
                  ? detailPanelRef.current?.expand()
                  : detailPanelRef.current?.collapse();
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-4 h-6 rounded bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 cursor-pointer"
              title={
                isDetailCollapsed ? "Open detail panel" : "Close detail panel"
              }
            >
              {isDetailCollapsed ? (
                <ChevronLeft size={10} strokeWidth={2.5} />
              ) : (
                <ChevronRight size={10} strokeWidth={2.5} />
              )}
            </button>
          </Separator>
          <Panel
            id="main"
            collapsible
            collapsedSize={0}
            minSize={20}
            panelRef={detailPanelRef}
            onResize={(size) => setIsDetailCollapsed(size.inPixels < 1)}
            className="flex flex-col overflow-hidden"
          >
            <main className="flex-1 flex flex-col overflow-hidden">
              {selectedRecording ? (
                <RecordingDetail
                  key={selectedRecording.id}
                  recording={selectedRecording}
                  onSave={handleSaveRecording}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
                  Select a recording
                </div>
              )}
            </main>
          </Panel>
        </Group>
      </div>
      {status && (
        <div className="fixed bottom-16 right-4 z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg px-4 py-2 text-xs text-zinc-300 pointer-events-none">
          {status}
        </div>
      )}
      <Playbar
        recording={selectedRecording}
        audioEl={audioEl}
        currentTime={currentTime}
        isPlaying={isPlaying}
        isLooping={isLooping}
        isAutoAdvance={isAutoAdvance}
        isAutoplay={isAutoplay}
        onTogglePlay={togglePlay}
        onStop={stop}
        onNext={playNext}
        onToggleLoop={toggleLoop}
        onToggleAutoAdvance={toggleAutoAdvance}
        onToggleAutoplay={toggleAutoplay}
        onNormalize={selectedRecording ? handleNormalize : undefined}
        onTrim={handleTrim}
      />
    </div>
  );
}
