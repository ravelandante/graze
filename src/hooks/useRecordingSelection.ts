import { useState } from "react";
import type { Recording } from "../types";
import { useStore } from "../store";

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

  // Call e.preventDefault() on mousedown to prevent browser text selection
  // during shift/ctrl clicks, before the click event fires.
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

  return { selectedIds, handleClick, handleMouseDown, handleContextMenu };
}
