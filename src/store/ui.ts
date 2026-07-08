import type { StateCreator } from "zustand";
import type { AppState, UiSlice } from "./types";

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (
  set,
  get,
) => ({
  selectedRecordingId: null,
  selectedIds: new Set<number>(),
  filterCollectionIds: new Set<number>(),
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
  setFilterCollectionIds: (ids) => set({ filterCollectionIds: ids }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setStatus: (s) => set({ status: s }),
});
