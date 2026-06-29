import { useEffect, useRef, useState } from "react";
import type { Collection } from "../types";

interface Props {
  recordingId: number;
  collections: Collection[];
  memberCollectionIds: Set<number>;
  onToggleCollection: (recordingId: number, collectionId: number, isMember: boolean) => void;
}

export function RecordingMenu({ recordingId, collections, memberCollectionIds, onToggleCollection }: Props) {
  const [open, setOpen] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCollections(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      setShowCollections(false);
    } else {
      setOpen(true);
      setShowCollections(false);
    }
  }

  return (
    <div ref={menuRef} className="absolute right-2 top-3">
      <button
        onClick={toggle}
        className={`p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-600 transition-opacity ${
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="2" cy="7" r="1.5" />
          <circle cx="7" cy="7" r="1.5" />
          <circle cx="12" cy="7" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 bg-zinc-800 border border-zinc-700 rounded shadow-xl min-w-[160px]">
          {!showCollections ? (
            <button
              onClick={(e) => { e.stopPropagation(); setShowCollections(true); }}
              className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
            >
              Add/remove from collection
            </button>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setShowCollections(false); }}
                className="w-full text-left px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-700 flex items-center gap-1"
              >
                ← Collections
              </button>
              {collections.length === 0 && (
                <p className="px-3 py-2 text-xs text-zinc-500">No collections yet</p>
              )}
              {collections.map((c) => {
                const isMember = memberCollectionIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCollection(recordingId, c.id, isMember);
                      setOpen(false);
                      setShowCollections(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 flex items-center justify-between gap-2"
                  >
                    <span>{c.name}</span>
                    {isMember && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-400">
                        <polyline points="1,6 4,10 11,2" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
