import { invoke } from "@tauri-apps/api/core";
import type { StateCreator } from "zustand";
import { fetchPeaks, savePeaks } from "@lib/db";
import type { Recording } from "@types";
import type { AppState, AudioSlice } from "./types";

// Parsed peaks are tens of KB per recording, so only a bounded window of
// recently used recordings is kept in memory; the rest stay in the DB.
const MAX_CACHED_PEAKS = 30;

function cacheWithEviction(
  cache: Map<number, number[][]>,
  id: number,
  peaks: number[][],
  keep: number | null,
): Map<number, number[][]> {
  const next = new Map(cache);
  next.delete(id); // re-insert so this entry becomes the newest
  next.set(id, peaks);
  for (const key of next.keys()) {
    if (next.size <= MAX_CACHED_PEAKS) break;
    if (key === id || key === keep) continue;
    next.delete(key);
  }
  return next;
}

export const createAudioSlice: StateCreator<AppState, [], [], AudioSlice> = (
  set,
  get,
) => ({
  hasPeaks: new Set<number>(),
  peaksCache: new Map<number, number[][]>(),

  loadPeaks: async (id) => {
    const { peaksCache, hasPeaks, selectedRecordingId } = get();
    const cached = peaksCache.get(id);
    if (cached) {
      set({
        peaksCache: cacheWithEviction(
          peaksCache,
          id,
          cached,
          selectedRecordingId,
        ),
      });
      return;
    }
    if (!hasPeaks.has(id)) return; // nothing stored yet; computation will fill in
    const peaks = await fetchPeaks(id);
    if (!peaks) return;
    set((state) => ({
      peaksCache: cacheWithEviction(
        state.peaksCache,
        id,
        peaks,
        state.selectedRecordingId,
      ),
    }));
  },

  startPeakComputation: (targets?: Recording[]) => {
    const { recordings, hasPeaks } = get();
    const pending = targets
      ? targets.filter((r) => r.status !== "missing")
      : recordings.filter((r) => r.status !== "missing" && !hasPeaks.has(r.id));
    if (pending.length === 0) return;

    const CONCURRENCY = 2;
    let inFlight = 0;
    let index = 0;

    function processNext() {
      while (inFlight < CONCURRENCY && index < pending.length) {
        const recordingToCompute = pending[index++];
        inFlight++;
        void (async () => {
          try {
            const peaks = await invoke<number[][]>("compute_peaks", {
              filePath: recordingToCompute.filePath,
            });
            await savePeaks(recordingToCompute.id, peaks);
            set((state) => ({
              hasPeaks: new Set(state.hasPeaks).add(recordingToCompute.id),
              ...(state.selectedRecordingId === recordingToCompute.id
                ? {
                    peaksCache: cacheWithEviction(
                      state.peaksCache,
                      recordingToCompute.id,
                      peaks,
                      state.selectedRecordingId,
                    ),
                  }
                : {}),
            }));
          } catch (err) {
            console.warn(
              `Peak computation failed for ${recordingToCompute.fileName}:`,
              err,
            );
          } finally {
            inFlight--;
            processNext();
          }
        })();
      }
    }

    processNext();
  },
});
