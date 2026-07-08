import { Check, ChevronRight, ListFilterPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "../store";

type FilterView = "root" | "collection";

export function FilterMenu() {
  const collections = useStore((s) => s.collections);
  const filterCollectionIds = useStore((s) => s.filterCollectionIds);
  const setFilterCollectionIds = useStore((s) => s.setFilterCollectionIds);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<FilterView>("root");

  const activeCount = filterCollectionIds.size;
  const chipLabel =
    activeCount === 1
      ? (collections.find((c) => c.id === [...filterCollectionIds][0])?.name ??
        "")
      : activeCount > 1
        ? `${activeCount} collections`
        : null;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (view === "collection") setView("root");
        else setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, view]);

  function handleOpenToggle() {
    if (open) {
      setOpen(false);
      setView("root");
    } else {
      setOpen(true);
    }
  }

  function handleClose() {
    setOpen(false);
    setView("root");
  }

  function toggleCollection(id: number) {
    const next = new Set(filterCollectionIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFilterCollectionIds(next);
  }

  return (
    <div className="relative flex items-center gap-1">
      <button
        onClick={handleOpenToggle}
        className={`p-1 rounded ${open ? "text-zinc-300" : "text-zinc-600 hover:text-zinc-400"}`}
        title="Add filter"
      >
        <ListFilterPlus size={14} strokeWidth={1.5} />
      </button>

      {chipLabel && (
        <span className="flex items-center gap-1 text-xs bg-zinc-700 text-zinc-300 rounded px-1.5 py-0.5">
          {chipLabel}
          <button
            onClick={() => setFilterCollectionIds(new Set())}
            className="text-zinc-500 hover:text-zinc-200"
            title="Clear filter"
          >
            <X size={10} strokeWidth={2} />
          </button>
        </span>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={handleClose} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-zinc-800 border border-zinc-700 rounded shadow-xl py-1 min-w-44">
            {view === "root" ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setView("collection");
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 flex items-center justify-between gap-3"
              >
                <span>Collection</span>
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
                    setView("root");
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-700 flex items-center gap-1.5"
                >
                  ← Collection
                </button>
                <div className="border-t border-zinc-700 mx-1 mb-1" />
                {collections.length === 0 ? (
                  <p className="px-3 py-1.5 text-xs text-zinc-500">
                    No collections yet
                  </p>
                ) : (
                  collections.map((c) => (
                    <button
                      key={c.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCollection(c.id);
                      }}
                      className="w-full text-left px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 flex items-center justify-between gap-3"
                    >
                      <span className="truncate">{c.name}</span>
                      {filterCollectionIds.has(c.id) && (
                        <Check
                          size={12}
                          strokeWidth={2}
                          className="shrink-0 text-zinc-400"
                        />
                      )}
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
