import { useEffect, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { useStore } from "../store";

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

  const [showCollections, setShowCollections] = useState(false);

  const rootHeight = ITEM_HEIGHT + 8; // one item + padding
  const collectionHeight = showCollections
    ? (collections.length || 1) * ITEM_HEIGHT + ITEM_HEIGHT + 8 // items + back row + padding
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
        className="fixed z-50 bg-zinc-800 border border-zinc-700 rounded shadow-xl py-1"
        style={{ left, top, minWidth: MENU_WIDTH }}
      >
        {!showCollections ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCollections(true);
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 flex items-center justify-between gap-3"
          >
            <span>Edit collection</span>
            <ChevronRight
              size={12}
              strokeWidth={1.5}
              className="shrink-0 text-zinc-500"
            />
          </button>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCollections(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-700 flex items-center gap-1.5"
            >
              ← Collections
            </button>
            <div className="border-t border-zinc-700 mx-1 mb-1" />
            {collections.length === 0 ? (
              <p className="px-3 py-1.5 text-xs text-zinc-500">
                No collections yet
              </p>
            ) : (
              collections.map((c) => {
                const isMember = memberCollectionIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      toggleCollectionMembership(recordingId, c.id, isMember);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 flex items-center justify-between gap-3"
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
