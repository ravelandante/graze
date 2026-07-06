import { useState } from "react";
import type { Recording } from "../types";
import { RecordingContextMenu } from "./RecordingContextMenu";
import { formatTime } from "../lib/format";
import { useStore } from "../store";
import { useRecordingSelection } from "../hooks/useRecordingSelection";

interface Props {
  recordings: Recording[];
}

interface ContextMenuState {
  recordingId: number;
  x: number;
  y: number;
}

export function RecordingListView({ recordings }: Props) {
  const searchQuery = useStore((s) => s.searchQuery);
  const {
    selectedIds,
    handleClick,
    handleMouseDown,
    handleContextMenu,
    getDragProps,
  } = useRecordingSelection(recordings);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  function onContextMenu(e: React.MouseEvent, recordingId: number) {
    handleContextMenu(e, recordingId);
    setContextMenu({ recordingId, x: e.clientX, y: e.clientY });
  }

  return (
    <>
      <ul className="flex-1 overflow-y-auto select-none">
        {recordings.length === 0 && (
          <li className="text-zinc-500 text-sm text-center py-10 px-4">
            {searchQuery ? "No results" : "Import recordings to get started"}
          </li>
        )}
        {recordings.map((r) => (
          <li key={r.id}>
            <button
              onMouseDown={handleMouseDown}
              onClick={(e) => handleClick(e, r.id)}
              onContextMenu={(e) => onContextMenu(e, r.id)}
              {...getDragProps(r.id)}
              className={`w-full text-left px-4 py-3 border-b border-zinc-800 ${
                selectedIds.has(r.id) ? "bg-zinc-700" : "hover:bg-zinc-800"
              } ${r.status === "missing" ? "opacity-50" : ""}`}
            >
              <p
                className={`text-sm font-medium truncate ${r.title ? "text-white" : "text-zinc-400"}`}
              >
                {r.title ?? "No title"}
                {r.status === "missing" && (
                  <span className="ml-2 text-xs font-normal text-amber-500">
                    Missing
                  </span>
                )}
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
