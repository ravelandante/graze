import { create } from "zustand";
import {
  addRecordingToCollection,
  removeRecordingFromCollection,
  deleteCollection as dbDeleteCollection,
  renameCollection as dbRenameCollection,
  fetchCollections,
  fetchMemberships,
  fetchRecordings,
  insertCollection,
  insertRecording,
  updateRecording,
} from "./lib/db";
import { extractMetadata } from "./lib/metadata";
import { normalizeFile, trimFile, writeFileMetadata } from "./lib/audio";
import type { Collection, Recording } from "./types";

interface AppState {
  recordings: Recording[];
  collections: Collection[];
  // collectionId → Set<recordingId>
  memberships: Map<number, Set<number>>;
  // recordingId → Set<collectionId> (inverse of memberships, computed on load)
  recordingMemberships: Map<number, Set<number>>;

  selectedRecordingId: number | null;
  selectedCollectionId: number | null;
  searchQuery: string;
  status: string | null;

  loadAll: () => Promise<void>;
  setSelectedRecordingId: (id: number | null) => void;
  setSelectedCollectionId: (id: number | null) => void;
  setSearchQuery: (q: string) => void;
  setStatus: (s: string | null) => void;

  createCollection: (name: string) => Promise<void>;
  renameCollection: (id: number, name: string) => Promise<void>;
  deleteCollection: (id: number) => Promise<void>;
  toggleCollectionMembership: (
    recordingId: number,
    collectionId: number,
    isMember: boolean,
  ) => Promise<void>;

  importRecordings: (filePaths: string[]) => Promise<void>;
  saveRecording: (updates: Partial<Recording>) => Promise<void>;
  normalizeRecording: () => Promise<void>;
  trimRecording: (start: number, end: number) => Promise<void>;
}

function invertMemberships(
  memberships: Map<number, Set<number>>,
): Map<number, Set<number>> {
  const result = new Map<number, Set<number>>();
  for (const [collectionId, recordingIds] of memberships) {
    for (const recordingId of recordingIds) {
      if (!result.has(recordingId)) result.set(recordingId, new Set());
      result.get(recordingId)!.add(collectionId);
    }
  }
  return result;
}

export const useStore = create<AppState>((set, get) => ({
  recordings: [],
  collections: [],
  memberships: new Map(),
  recordingMemberships: new Map(),
  selectedRecordingId: null,
  selectedCollectionId: null,
  searchQuery: "",
  status: null,

  loadAll: async () => {
    const [recordings, collections, memberships] = await Promise.all([
      fetchRecordings(),
      fetchCollections(),
      fetchMemberships(),
    ]);
    set({ recordings, collections, memberships, recordingMemberships: invertMemberships(memberships) });
  },

  setSelectedRecordingId: (id) => set({ selectedRecordingId: id }),
  setSelectedCollectionId: (id) => set({ selectedCollectionId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setStatus: (s) => set({ status: s }),

  createCollection: async (name) => {
    await insertCollection(name);
    await get().loadAll();
  },

  renameCollection: async (id, name) => {
    await dbRenameCollection(id, name);
    await get().loadAll();
  },

  deleteCollection: async (id) => {
    if (get().selectedCollectionId === id) set({ selectedCollectionId: null });
    await dbDeleteCollection(id);
    await get().loadAll();
  },

  toggleCollectionMembership: async (recordingId, collectionId, isMember) => {
    if (isMember) {
      await removeRecordingFromCollection(recordingId, collectionId);
    } else {
      await addRecordingToCollection(recordingId, collectionId);
    }
    await get().loadAll();
  },

  importRecordings: async (filePaths) => {
    set({ status: `Importing ${filePaths.length} file(s)…` });
    for (const filePath of filePaths) {
      try {
        const meta = await extractMetadata(filePath);
        await insertRecording(meta);
      } catch (err) {
        console.error("Failed to import", filePath, err);
      }
    }
    set({ status: null });
    await get().loadAll();
  },

  saveRecording: async (updates) => {
    const { selectedRecordingId, recordings } = get();
    const recording = recordings.find((r) => r.id === selectedRecordingId);
    if (!recording || !selectedRecordingId) return;
    set({ status: "Saving…" });
    try {
      await writeFileMetadata(recording.filePath, {
        title: updates.title,
        comment: updates.comment,
      });
    } catch (err) {
      set({ status: "File write failed: " + String(err) });
      setTimeout(() => set({ status: null }), 5000);
      return;
    }
    await updateRecording(selectedRecordingId, {
      title: updates.title ?? null,
      comment: updates.comment ?? null,
    });
    set({ status: null });
    await get().loadAll();
  },

  normalizeRecording: async () => {
    const { selectedRecordingId, recordings } = get();
    const recording = recordings.find((r) => r.id === selectedRecordingId);
    if (!recording) return;
    const outPath = recording.filePath.replace(/(\.\w+)$/, "_normalized$1");
    set({ status: "Normalizing…" });
    try {
      await normalizeFile(recording.filePath, outPath);
      set({ status: "Normalized → " + outPath.split("/").pop() });
    } catch (err) {
      set({ status: "Normalize failed: " + String(err) });
    }
    setTimeout(() => set({ status: null }), 4000);
  },

  trimRecording: async (start, end) => {
    const { selectedRecordingId, recordings } = get();
    const recording = recordings.find((r) => r.id === selectedRecordingId);
    if (!recording) return;
    const outPath = recording.filePath.replace(
      /(\.\w+)$/,
      `_trim${start}-${end}$1`,
    );
    set({ status: "Trimming…" });
    try {
      await trimFile(recording.filePath, outPath, start, end);
      set({ status: "Trimmed → " + outPath.split("/").pop() });
    } catch (err) {
      set({ status: "Trim failed: " + String(err) });
    }
    setTimeout(() => set({ status: null }), 4000);
  },
}));
