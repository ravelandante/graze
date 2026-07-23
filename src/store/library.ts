import { invoke } from "@tauri-apps/api/core";
import type { StateCreator } from "zustand";
import {
  addRecordingToCollection,
  removeRecordingFromCollection,
  deleteRecording as dbDeleteRecording,
  deleteCollection as dbDeleteCollection,
  renameCollection as dbRenameCollection,
  fetchCollections,
  fetchMemberships,
  fetchWatchedFolders,
  insertWatchedFolder,
  deleteWatchedFolder,
  getExistingPeaks,
  fetchRecordings,
  insertCollection,
  insertRecording,
  setRecordingsStatus,
  setRecordingsStatusByPath,
  updateRecording,
  type RecordingInsert,
} from "@lib/db";
import { extractMetadata } from "@lib/metadata";
import { normalizeFile, trimFile, writeFileMetadata } from "@lib/audio";
import type { AppState, LibrarySlice } from "./types";

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

export const createLibrarySlice: StateCreator<
  AppState,
  [],
  [],
  LibrarySlice
> = (set, get) => ({
  recordings: [],
  collections: [],
  watchedFolders: [],
  memberships: new Map(),
  recordingMemberships: new Map(),

  loadAll: async () => {
    const [recordings, collections, memberships, peaksMap] = await Promise.all([
      fetchRecordings(),
      fetchCollections(),
      fetchMemberships(),
      getExistingPeaks(),
    ]);
    set({
      recordings,
      collections,
      memberships,
      recordingMemberships: invertMemberships(memberships),
      peaksMap,
    });
  },

  reconcileLibrary: async () => {
    const folders = await fetchWatchedFolders();
    set({ watchedFolders: folders });

    if (folders.length > 0) {
      await invoke("watch_paths", { paths: folders });
    }

    const scanResults = await Promise.all(
      folders.map((f) => invoke<RecordingInsert[]>("scan_folder", { path: f })),
    );
    for (const metas of scanResults) {
      for (const meta of metas) {
        await insertRecording(meta);
      }
    }

    await get().loadAll();
    const recordings = get().recordings;
    if (recordings.length === 0) return;

    const presence = await invoke<boolean[]>("paths_exist", {
      paths: recordings.map((r) => r.filePath),
    });

    const nowMissingIds: number[] = [];
    const nowPresentIds: number[] = [];
    recordings.forEach((r, i) => {
      if (!presence[i] && r.status !== "missing") nowMissingIds.push(r.id);
      if (presence[i] && r.status === "missing") nowPresentIds.push(r.id);
    });

    await setRecordingsStatus(nowMissingIds, "missing");
    await setRecordingsStatus(nowPresentIds, "present");

    if (nowMissingIds.length > 0 || nowPresentIds.length > 0) {
      const changed = new Map<number, "present" | "missing">();
      nowMissingIds.forEach((id) => changed.set(id, "missing"));
      nowPresentIds.forEach((id) => changed.set(id, "present"));
      set({
        recordings: get().recordings.map((r) =>
          changed.has(r.id) ? { ...r, status: changed.get(r.id)! } : r,
        ),
      });
    }

    get().startPeakComputation();
  },

  addWatchedFolder: async (path) => {
    await insertWatchedFolder(path);
    const metas = await invoke<RecordingInsert[]>("scan_folder", { path });
    for (const meta of metas) {
      await insertRecording(meta);
    }
    await invoke("watch_paths", { paths: [path] });
    await get().loadAll();
    set({ watchedFolders: [...get().watchedFolders, path] });
    const recordings = get().recordings;
    const newOnes = recordings.filter((r) =>
      metas.some((m) => m.filePath === r.filePath),
    );
    get().startPeakComputation(newOnes);
  },

  removeWatchedFolder: async (path) => {
    await deleteWatchedFolder(path);
    await invoke("unwatch_folder", { path });
    set({ watchedFolders: get().watchedFolders.filter((f) => f !== path) });
  },

  handleFilesAdded: (metas) => {
    void (async () => {
      for (const meta of metas) {
        await insertRecording(meta);
      }
      await setRecordingsStatusByPath(
        metas.map((m) => m.filePath),
        "present",
      );
      await get().loadAll();
      const recordings = get().recordings;
      const newOnes = recordings.filter((r) =>
        metas.some((m) => m.filePath === r.filePath),
      );
      get().startPeakComputation(newOnes);
    })().catch((err) => console.error("handleFilesAdded:", err));
  },

  handleFilesRemoved: (paths) => {
    void (async () => {
      await setRecordingsStatusByPath(paths, "missing");
      set({
        recordings: get().recordings.map((r) =>
          paths.includes(r.filePath) ? { ...r, status: "missing" as const } : r,
        ),
      });
    })().catch((err) => console.error("handleFilesRemoved:", err));
  },

  createCollection: async (name) => {
    await insertCollection(name);
    await get().loadAll();
  },

  renameCollection: async (id, name) => {
    await dbRenameCollection(id, name);
    await get().loadAll();
  },

  deleteCollection: async (id) => {
    const { filterCollectionIds } = get();
    if (filterCollectionIds.has(id)) {
      const next = new Set(filterCollectionIds);
      next.delete(id);
      set({ filterCollectionIds: next });
    }
    await dbDeleteCollection(id);
    await get().loadAll();
  },

  removeRecording: async (ids) => {
    for (const id of ids) await dbDeleteRecording(id);
    const { selectedRecordingId, peaksMap, selectedIds } = get();
    const idSet = new Set(ids);
    const nextPeaksMap = new Map(peaksMap);
    for (const id of ids) nextPeaksMap.delete(id);
    set({
      recordings: get().recordings.filter((r) => !idSet.has(r.id)),
      peaksMap: nextPeaksMap,
      selectedRecordingId: idSet.has(selectedRecordingId!)
        ? null
        : selectedRecordingId,
      selectedIds: new Set([...selectedIds].filter((id) => !idSet.has(id))),
    });
  },

  toggleCollectionMembership: async (recordingIds, collectionId, isMember) => {
    for (const recordingId of recordingIds) {
      if (isMember) {
        await removeRecordingFromCollection(recordingId, collectionId);
      } else {
        await addRecordingToCollection(recordingId, collectionId);
      }
    }
    await get().loadAll();
  },

  addRecordingsToCollection: async (recordingIds, collectionId) => {
    const { recordingMemberships } = get();
    for (const recordingId of recordingIds) {
      const alreadyMember =
        recordingMemberships.get(recordingId)?.has(collectionId) ?? false;
      if (!alreadyMember)
        await addRecordingToCollection(recordingId, collectionId);
    }
    await get().loadAll();
  },

  importRecordings: async (filePaths) => {
    set({
      status: `Importing ${filePaths.length} file${filePaths.length !== 1 ? "s" : ""}…`,
    });
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
    const imported = get().recordings.filter((r) =>
      filePaths.includes(r.filePath),
    );
    get().startPeakComputation(imported);
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
});
