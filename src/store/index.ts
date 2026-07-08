import { create } from "zustand";
import { createAudioSlice } from "./audio";
import { createLibrarySlice } from "./library";
import { createUiSlice } from "./ui";
import type { AppState } from "./types";

export { type AppState };

export const useStore = create<AppState>((set, get, api) => ({
  ...createUiSlice(set, get, api),
  ...createLibrarySlice(set, get, api),
  ...createAudioSlice(set, get, api),
}));
