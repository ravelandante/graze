import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { RecordingInsert } from "./db";

export async function registerWatcherListeners(
  onAdded: (metas: RecordingInsert[]) => void,
  onRemoved: (paths: string[]) => void,
): Promise<UnlistenFn> {
  const unlistenAdded = await listen<RecordingInsert[]>(
    "library:files-added",
    (e) => onAdded(e.payload),
  );
  const unlistenRemoved = await listen<{ paths: string[] }>(
    "library:files-removed",
    (e) => onRemoved(e.payload.paths),
  );
  return () => {
    unlistenAdded();
    unlistenRemoved();
  };
}
