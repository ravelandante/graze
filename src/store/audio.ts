import { invoke } from "@tauri-apps/api/core";
import type { StateCreator } from "zustand";
import { savePeaks } from "../lib/db";
import type { Recording } from "../types";
import type { AppState, AudioSlice } from "./types";

export const createAudioSlice: StateCreator<AppState, [], [], AudioSlice> = (
  set,
  get,
) => ({
  peaksMap: new Map(),

  startPeakComputation: (targets?: Recording[]) => {
    const { recordings, peaksMap } = get();
    const pending = targets
      ? targets.filter((r) => r.status !== "missing")
      : recordings.filter((r) => r.status !== "missing" && !peaksMap.has(r.id));
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
              peaksMap: new Map(state.peaksMap).set(
                recordingToCompute.id,
                peaks,
              ),
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
