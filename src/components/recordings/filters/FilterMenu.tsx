import { ListFilterPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@store";
import type { RecordingColumn } from "@types";
import {
  describeFilter,
  isFilterActive,
  newFilter,
  type ColumnFilter,
} from "@lib/filterColumns";
import { FilterRootView } from "./FilterRootView";
import { FilterCollectionView } from "./FilterCollectionView";
import { FilterColumnView } from "./FilterColumnView";

type FilterView =
  | { kind: "root" }
  | { kind: "collection" }
  | { kind: "column"; column: RecordingColumn };

export function FilterMenu() {
  const collections = useStore((s) => s.collections);
  const filterCollectionIds = useStore((s) => s.filterCollectionIds);
  const setFilterCollectionIds = useStore((s) => s.setFilterCollectionIds);
  const columnFilters = useStore((s) => s.columnFilters);
  const setColumnFilters = useStore((s) => s.setColumnFilters);
  const clearAllFilters = useStore((s) => s.clearAllFilters);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<FilterView>({ kind: "root" });
  const [draft, setDraft] = useState<ColumnFilter | null>(null);

  const collectionCount = filterCollectionIds.size;
  const collectionChipLabel =
    collectionCount === 1
      ? (collections.find((c) => c.id === [...filterCollectionIds][0])?.name ??
        "")
      : collectionCount > 1
        ? `${collectionCount} collections`
        : null;

  const hasAnyFilter = collectionCount > 0 || columnFilters.length > 0;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (view.kind !== "root") setView({ kind: "root" });
        else setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, view]);

  function handleOpenToggle() {
    if (open) {
      setOpen(false);
      setView({ kind: "root" });
    } else {
      setOpen(true);
    }
  }

  function handleClose() {
    setOpen(false);
    setView({ kind: "root" });
  }

  function toggleCollection(id: number) {
    const next = new Set(filterCollectionIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFilterCollectionIds(next);
  }

  function getFilter(column: RecordingColumn) {
    return columnFilters.find((f) => f.column === column);
  }

  function commitDraft(next: ColumnFilter) {
    setDraft(next);
    const exists = columnFilters.some((f) => f.column === next.column);
    if (isFilterActive(next)) {
      setColumnFilters(
        exists
          ? columnFilters.map((f) => (f.column === next.column ? next : f))
          : [...columnFilters, next],
      );
    } else if (exists) {
      setColumnFilters(columnFilters.filter((f) => f.column !== next.column));
    }
  }

  function removeFilter(column: RecordingColumn) {
    setColumnFilters(columnFilters.filter((f) => f.column !== column));
    if (view.kind === "column" && view.column === column) handleClose();
  }

  function openColumn(column: RecordingColumn) {
    setDraft(getFilter(column) ?? newFilter(column));
    setView({ kind: "column", column });
  }

  function editChip(column: RecordingColumn) {
    setOpen(true);
    setDraft(getFilter(column) ?? newFilter(column));
    setView({ kind: "column", column });
  }

  return (
    <div className="relative flex items-center gap-1 flex-wrap">
      <button
        onClick={handleOpenToggle}
        className={`p-1 rounded ${open ? "text-zinc-300" : "text-zinc-600 hover:text-zinc-400"}`}
        title="Add filter"
      >
        <ListFilterPlus size={14} strokeWidth={1.5} />
      </button>

      {collectionChipLabel && (
        <span className="relative z-30 flex items-center gap-1 text-xs bg-zinc-700 text-zinc-300 rounded px-1.5 py-0.5">
          <button
            onClick={() => {
              setOpen(true);
              setView({ kind: "collection" });
            }}
            className="hover:text-white"
          >
            {collectionChipLabel}
          </button>
          <button
            onClick={() => setFilterCollectionIds(new Set())}
            className="text-zinc-500 hover:text-zinc-200"
            title="Clear filter"
          >
            <X size={10} strokeWidth={2} />
          </button>
        </span>
      )}

      {columnFilters.map((f) => (
        <span
          key={f.column}
          className="relative z-30 flex items-center gap-1 text-xs bg-zinc-700 text-zinc-300 rounded px-1.5 py-0.5"
        >
          <button
            onClick={() => editChip(f.column)}
            className="hover:text-white"
          >
            {describeFilter(f)}
          </button>
          <button
            onClick={() => removeFilter(f.column)}
            className="text-zinc-500 hover:text-zinc-200"
            title="Remove filter"
          >
            <X size={10} strokeWidth={2} />
          </button>
        </span>
      ))}

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={handleClose} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-zinc-800 border border-zinc-700 rounded shadow-xl py-1 min-w-52">
            {view.kind === "root" && (
              <FilterRootView
                filteredColumns={new Set(columnFilters.map((f) => f.column))}
                collectionActive={collectionCount > 0}
                hasAnyFilter={hasAnyFilter}
                onPickCollection={() => setView({ kind: "collection" })}
                onPickColumn={openColumn}
                onClearAll={() => {
                  clearAllFilters();
                  handleClose();
                }}
              />
            )}

            {view.kind === "collection" && (
              <FilterCollectionView
                collections={collections}
                selectedIds={filterCollectionIds}
                onBack={() => setView({ kind: "root" })}
                onToggle={toggleCollection}
              />
            )}

            {view.kind === "column" && (
              <FilterColumnView
                filter={draft ?? newFilter(view.column)}
                onBack={() => setView({ kind: "root" })}
                onChange={commitDraft}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
