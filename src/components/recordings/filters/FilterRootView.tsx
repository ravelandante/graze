import type { RecordingColumn } from "@types";
import { FILTER_COLUMNS } from "@lib/filterColumns";
import { MenuSeparator } from "@components/common/menu";
import { FilterRootRow } from "./FilterRootRow";

export function FilterRootView({
  filteredColumns,
  collectionActive,
  hasAnyFilter,
  onPickCollection,
  onPickColumn,
  onClearAll,
}: {
  filteredColumns: Set<RecordingColumn>;
  collectionActive: boolean;
  hasAnyFilter: boolean;
  onPickCollection: () => void;
  onPickColumn: (column: RecordingColumn) => void;
  onClearAll: () => void;
}) {
  return (
    <>
      <FilterRootRow
        label="Collection"
        active={collectionActive}
        onClick={onPickCollection}
      />
      {FILTER_COLUMNS.map((col) => (
        <FilterRootRow
          key={col.id}
          label={col.label}
          active={filteredColumns.has(col.id)}
          onClick={() => onPickColumn(col.id)}
        />
      ))}
      {hasAnyFilter && (
        <>
          <MenuSeparator />
          <button
            onClick={onClearAll}
            className="w-full text-left px-2.5 py-1 text-sm text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
          >
            Clear all
          </button>
        </>
      )}
    </>
  );
}
