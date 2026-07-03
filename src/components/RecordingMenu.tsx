import { useEffect, useRef, useState } from "react";
import { Check, MoreHorizontal } from "lucide-react";
import { useStore } from "../store";

interface Props {
  recordingId: number;
}

export function RecordingMenu({ recordingId }: Props) {
  const collections = useStore((s) => s.collections);
  const memberCollectionIds =
    useStore((s) => s.recordingMemberships).get(recordingId) ??
    new Set<number>();
  const toggleCollectionMembership = useStore(
    (s) => s.toggleCollectionMembership,
  );

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
        <MoreHorizontal size={14} strokeWidth={1.5} />
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 bg-zinc-800 border border-zinc-700 rounded shadow-xl min-w-40">
          {!showCollections ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCollections(true);
              }}
              className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
            >
              Add/remove from collection
            </button>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCollections(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-700 flex items-center gap-1"
              >
                ← Collections
              </button>
              {collections.length === 0 && (
                <p className="px-3 py-2 text-xs text-zinc-500">
                  No collections yet
                </p>
              )}
              {collections.map((c) => {
                const isMember = memberCollectionIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCollectionMembership([recordingId], c.id, isMember);
                      setOpen(false);
                      setShowCollections(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 flex items-center justify-between gap-2"
                  >
                    <span>{c.name}</span>
                    {isMember && (
                      <Check
                        size={12}
                        strokeWidth={2}
                        className="shrink-0 text-zinc-400"
                      />
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
