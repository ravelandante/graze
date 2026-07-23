import type { RecordingInsert } from "../lib/db";
import type { ColumnFilter } from "../lib/filterColumns";
import type { Collection, Recording } from "../types";

export interface UiSlice {
  selectedRecordingId: number | null;
  selectedIds: Set<number>;
  filterCollectionIds: Set<number>;
  columnFilters: ColumnFilter[];
  searchQuery: string;
  status: string | null;

  setSelectedRecordingId: (id: number | null) => void;
  setSelectedIds: (ids: Set<number>) => void;
  setFilterCollectionIds: (ids: Set<number>) => void;
  setColumnFilters: (filters: ColumnFilter[]) => void;
  clearAllFilters: () => void;
  setSearchQuery: (q: string) => void;
  setStatus: (s: string | null) => void;
}

export interface LibrarySlice {
  recordings: Recording[];
  collections: Collection[];
  watchedFolders: string[];
  // collectionId → Set<recordingId>
  memberships: Map<number, Set<number>>;
  // recordingId → Set<collectionId> (inverse of memberships, computed on load)
  recordingMemberships: Map<number, Set<number>>;

  loadAll: () => Promise<void>;
  reconcileLibrary: () => Promise<void>;
  addWatchedFolder: (path: string) => Promise<void>;
  removeWatchedFolder: (path: string) => Promise<void>;
  handleFilesAdded: (metas: RecordingInsert[]) => void;
  handleFilesRemoved: (paths: string[]) => void;
  createCollection: (name: string) => Promise<void>;
  renameCollection: (id: number, name: string) => Promise<void>;
  deleteCollection: (id: number) => Promise<void>;
  toggleCollectionMembership: (
    recordingIds: number[],
    collectionId: number,
    isMember: boolean,
  ) => Promise<void>;
  addRecordingsToCollection: (
    recordingIds: number[],
    collectionId: number,
  ) => Promise<void>;
  removeRecording: (ids: number[]) => Promise<void>;
  importRecordings: (filePaths: string[]) => Promise<void>;
  saveRecording: (updates: Partial<Recording>) => Promise<void>;
  normalizeRecording: () => Promise<void>;
  trimRecording: (start: number, end: number) => Promise<void>;
}

export interface AudioSlice {
  // recordingId → peaks (one float array per channel)
  peaksMap: Map<number, number[][]>;
  startPeakComputation: (targets?: Recording[]) => void;
}

export type AppState = UiSlice & LibrarySlice & AudioSlice;
