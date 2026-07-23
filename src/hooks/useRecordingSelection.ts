import { useState } from "react";
import type { Recording } from "@types";
import { useStore } from "@store";

export const RECORDING_DRAG_TYPE = "application/graze-recordings";

function createDragGhost(count: number): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;top:-100px;left:-100px;background:#3f3f46;color:#e4e4e7;" +
    "border:1px solid #52525b;border-radius:6px;padding:3px 10px;" +
    "font-size:12px;font-family:system-ui,sans-serif;white-space:nowrap;pointer-events:none;";
  el.textContent = `${count} recording${count !== 1 ? "s" : ""}`;
  document.body.appendChild(el);
  return el;
}

export function useRecordingSelection(recordings: Recording[]) {
  const selectedIds = useStore((s) => s.selectedIds);
  const setSelectedIds = useStore((s) => s.setSelectedIds);
  const setSelectedRecordingId = useStore((s) => s.setSelectedRecordingId);
  const [anchorId, setAnchorId] = useState<number | null>(null);

  function handleClick(e: React.MouseEvent, recordingId: number) {
    if (e.shiftKey && anchorId !== null) {
      const anchorIdx = recordings.findIndex((r) => r.id === anchorId);
      const clickIdx = recordings.findIndex((r) => r.id === recordingId);
      const [lo, hi] = [
        Math.min(anchorIdx, clickIdx),
        Math.max(anchorIdx, clickIdx),
      ];
      setSelectedIds(new Set(recordings.slice(lo, hi + 1).map((r) => r.id)));
    } else if (e.metaKey || e.ctrlKey) {
      const next = new Set(selectedIds);
      if (next.has(recordingId)) next.delete(recordingId);
      else next.add(recordingId);
      setSelectedIds(next);
      setAnchorId(recordingId);
    } else {
      setSelectedIds(new Set([recordingId]));
      setAnchorId(recordingId);
      setSelectedRecordingId(recordingId);
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (e.shiftKey || e.metaKey || e.ctrlKey) e.preventDefault();
  }

  function handleContextMenu(e: React.MouseEvent, recordingId: number) {
    e.preventDefault();
    if (!selectedIds.has(recordingId)) {
      setSelectedIds(new Set([recordingId]));
      setAnchorId(recordingId);
      setSelectedRecordingId(recordingId);
    }
  }

  function getDragProps(recordingId: number) {
    return {
      draggable: true,
      onDragStart(e: React.DragEvent) {
        // Drag the whole selection if this recording is part of it, else just this one
        const dragIds = selectedIds.has(recordingId)
          ? selectedIds
          : new Set([recordingId]);
        e.dataTransfer.setData(
          RECORDING_DRAG_TYPE,
          JSON.stringify([...dragIds]),
        );
        e.dataTransfer.effectAllowed = "copy";
        const ghost = createDragGhost(dragIds.size);
        e.dataTransfer.setDragImage(ghost, 10, 10);
        setTimeout(() => ghost.remove(), 0);
      },
    };
  }

  return {
    selectedIds,
    handleClick,
    handleMouseDown,
    handleContextMenu,
    getDragProps,
  };
}
