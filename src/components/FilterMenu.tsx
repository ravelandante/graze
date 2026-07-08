import { Check, ListFilterPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "../store";

export function FilterMenu() {
  const collections = useStore((s) => s.collections);
  const selectedCollectionId = useStore((s) => s.selectedCollectionId);
  const setSelectedCollectionId = useStore((s) => s.setSelectedCollectionId);

  const [open, setOpen] = useState(false);

  const activeCollection =
    collections.find((c) => c.id === selectedCollectionId) ?? null;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function selectCollection(id: number) {
    setSelectedCollectionId(selectedCollectionId === id ? null : id);
    setOpen(false);
  }

  return (
    <div className="relative flex items-center gap-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`p-1 rounded ${open ? "text-zinc-300" : "text-zinc-600 hover:text-zinc-400"}`}
        title="Add filter"
      >
        <ListFilterPlus size={14} strokeWidth={1.5} />
      </button>

      {activeCollection && (
        <span className="flex items-center gap-1 text-xs bg-zinc-700 text-zinc-300 rounded px-1.5 py-0.5">
          {activeCollection.name}
          <button
            onClick={() => setSelectedCollectionId(null)}
            className="text-zinc-500 hover:text-zinc-200"
            title="Clear filter"
          >
            <X size={10} strokeWidth={2} />
          </button>
        </span>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-zinc-800 border border-zinc-700 rounded shadow-xl py-1 min-w-40">
            <p className="px-3 py-1.5 text-xs text-zinc-500 font-medium">
              Collection
            </p>
            <div className="border-t border-zinc-700 mx-1 mb-1" />
            {collections.length === 0 ? (
              <p className="px-3 py-1.5 text-xs text-zinc-500">
                No collections yet
              </p>
            ) : (
              collections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCollection(c.id)}
                  className="w-full text-left px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 flex items-center justify-between gap-3"
                >
                  <span className="truncate">{c.name}</span>
                  {selectedCollectionId === c.id && (
                    <Check
                      size={12}
                      strokeWidth={2}
                      className="shrink-0 text-zinc-400"
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
