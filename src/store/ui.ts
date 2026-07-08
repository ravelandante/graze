import type { StateCreator } from "zustand";
import type { AppState, UiSlice } from "./types";

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (
  set,
  get,
) => ({
  selectedRecordingId: null,
  selectedIds: new Set<number>(),
  selectedCollectionId: null,
  searchQuery: "",
  status: null,

  setSelectedRecordingId: (id) => {
    const { selectedIds } = get();
    set({
      selectedRecordingId: id,
      ...(selectedIds.size <= 1
        ? { selectedIds: id !== null ? new Set([id]) : new Set<number>() }
        : {}),
    });
  },
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  setSelectedCollectionId: (id) => set({ selectedCollectionId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setStatus: (s) => set({ status: s }),
});
