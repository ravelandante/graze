import { useState } from "react";
import { RECORDING_DRAG_TYPE } from "./useRecordingSelection";

export function useRecordingDropTargets(
  onDrop: (recordingIds: number[], targetId: number) => void,
) {
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  function getDropProps(targetId: number) {
    return {
      onDragOver(e: React.DragEvent) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setDragOverId(targetId);
      },
      onDragEnter(e: React.DragEvent) {
        e.preventDefault();
        setDragOverId(targetId);
      },
      onDragLeave(e: React.DragEvent) {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDragOverId(null);
        }
      },
      onDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOverId(null);
        const raw = e.dataTransfer.getData(RECORDING_DRAG_TYPE);
        if (!raw) return;
        onDrop(JSON.parse(raw) as number[], targetId);
      },
    };
  }

  return { dragOverId, getDropProps };
}
