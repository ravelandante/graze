import { useEffect, useState } from "react";
import { Check, ChevronRight, Trash2 } from "lucide-react";
import { useStore } from "@store";
import {
  MENU_ITEM,
  MENU_ITEM_DANGER,
  MENU_ITEM_MUTED,
  MENU_PANEL,
  MenuSeparator,
} from "@components/common/menu";

interface Props {
  recordingId: number;
  x: number;
  y: number;
  onClose: () => void;
}

const MENU_WIDTH = 192;
const ITEM_HEIGHT = 32;

export function RecordingContextMenu({ recordingId, x, y, onClose }: Props) {
  const collections = useStore((s) => s.collections);
  const memberCollectionIds =
    useStore((s) => s.recordingMemberships.get(recordingId)) ??
    new Set<number>();
  const toggleCollectionMembership = useStore(
    (s) => s.toggleCollectionMembership,
  );
  const removeRecording = useStore((s) => s.removeRecording);
  const selectedIds = [...useStore((s) => s.selectedIds)];

  const [showCollections, setShowCollections] = useState(false);

  const rootHeight = ITEM_HEIGHT * 2 + 1; // items + separator
  const collectionHeight = showCollections
    ? (collections.length || 1) * ITEM_HEIGHT + ITEM_HEIGHT + 1 // items + back row + separator
    : rootHeight;

  const left = x + MENU_WIDTH > window.innerWidth ? x - MENU_WIDTH : x;
  const top =
    y + collectionHeight > window.innerHeight
      ? Math.max(8, y - collectionHeight)
      : y;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showCollections) setShowCollections(false);
        else onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, showCollections]);

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        className={`${MENU_PANEL} fixed z-50`}
        style={{ left, top, minWidth: MENU_WIDTH }}
      >
        {!showCollections ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCollections(true);
              }}
              className={`${MENU_ITEM} flex items-center justify-between gap-3`}
            >
              <span>Edit collection</span>
              <ChevronRight
                size={12}
                strokeWidth={1.5}
                className="shrink-0 text-zinc-500"
              />
            </button>
            <MenuSeparator />
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeRecording(selectedIds);
                onClose();
              }}
              className={`${MENU_ITEM_DANGER} flex items-center justify-between gap-3`}
            >
              <span>Remove from library</span>
              <Trash2 size={12} strokeWidth={1.5} className="shrink-0" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCollections(false);
              }}
              className={`${MENU_ITEM_MUTED} flex items-center gap-1.5`}
            >
              ← Collections
            </button>
            <MenuSeparator />
            {collections.length === 0 ? (
              <p className="px-2.5 py-1 text-xs text-zinc-500">
                No collections yet
              </p>
            ) : (
              collections.map((c) => {
                const isMember = memberCollectionIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      toggleCollectionMembership(selectedIds, c.id, isMember);
                      onClose();
                    }}
                    className={`${MENU_ITEM} flex items-center justify-between gap-3`}
                  >
                    <span className="truncate">{c.name}</span>
                    {isMember && (
                      <Check
                        size={12}
                        strokeWidth={2}
                        className="shrink-0 text-zinc-400"
                      />
                    )}
                  </button>
                );
              })
            )}
          </>
        )}
      </div>
    </>
  );
}
