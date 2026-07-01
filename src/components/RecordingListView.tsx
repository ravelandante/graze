import { useState } from "react";
import type { Recording } from "../types";
import { RecordingContextMenu } from "./RecordingContextMenu";
import { formatTime } from "../lib/format";
import { useStore } from "../store";

interface Props {
  recordings: Recording[];
}

interface ContextMenuState {
  recordingId: number;
  x: number;
  y: number;
}

export function RecordingListView({ recordings }: Props) {
  const selectedId = useStore((s) => s.selectedRecordingId);
  const setSelectedId = useStore((s) => s.setSelectedRecordingId);
  const searchQuery = useStore((s) => s.searchQuery);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  function handleContextMenu(e: React.MouseEvent, recordingId: number) {
    e.preventDefault();
    setSelectedId(recordingId);
    setContextMenu({ recordingId, x: e.clientX, y: e.clientY });
  }

  return (
    <>
      <ul className="flex-1 overflow-y-auto">
        {recordings.length === 0 && (
          <li className="text-zinc-500 text-sm text-center py-10 px-4">
            {searchQuery ? "No results" : "Import recordings to get started"}
          </li>
        )}
        {recordings.map((r) => (
          <li key={r.id}>
            <button
              onClick={() => setSelectedId(r.id)}
              onContextMenu={(e) => handleContextMenu(e, r.id)}
              className={`w-full text-left px-4 py-3 border-b border-zinc-800 ${
                selectedId === r.id ? "bg-zinc-700" : "hover:bg-zinc-800"
              }`}
            >
              <p
                className={`text-sm font-medium truncate ${r.title ? "text-white" : "text-zinc-400"}`}
              >
                {r.title ?? "No title"}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">
                {r.fileName}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5 flex gap-2 min-w-0">
                <span className="truncate">
                  {r.originator ?? "Unknown device"}
                </span>
                <span className="shrink-0">
                  {formatTime(r.durationSeconds ?? 0)}
                </span>
              </p>
            </button>
          </li>
        ))}
      </ul>
      {contextMenu && (
        <RecordingContextMenu
          recordingId={contextMenu.recordingId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
