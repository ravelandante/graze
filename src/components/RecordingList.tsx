import { useState } from "react";
import { LayoutList, Table2 } from "lucide-react";
import { ColumnVisibilityMenu } from "./ColumnVisibilityMenu";
import { ImportMenu } from "./ImportMenu";
import type { Collection, Recording } from "../types";
import { RecordingListView } from "./RecordingListView";
import { RecordingTableView } from "./RecordingTableView";
import { loadSetting, saveSetting } from "../lib/settings";

interface Props {
  recordings: Recording[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onImport: () => void;
  onImportFolder: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  collections: Collection[];
  memberships: Map<number, Set<number>>;
  onToggleCollection: (
    recordingId: number,
    collectionId: number,
    isMember: boolean,
  ) => void;
}

const TABLE_COLUMNS = [
  { id: "title", label: "Title" },
  { id: "fileName", label: "Filename" },
  { id: "originator", label: "Device" },
  { id: "timeRef", label: "TimeRef" },
];

export function RecordingList({
  recordings,
  selectedId,
  onSelect,
  onImport,
  onImportFolder,
  searchQuery,
  onSearchChange,
  collections,
  memberships,
  onToggleCollection,
}: Props) {
  const [view, setView] = useState<"list" | "table">(() =>
    loadSetting("viewMode", "list"),
  );
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    () => loadSetting("tableColumnVisibility", {}),
  );
  function handleSetView(next: "list" | "table") {
    setView(next);
    saveSetting("viewMode", next);
  }

  function handleColumnVisibilityChange(next: Record<string, boolean>) {
    setColumnVisibility(next);
    saveSetting("tableColumnVisibility", next);
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Search + import */}
      <div className="px-3 py-2 border-b border-zinc-800 flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search recordings…"
          className="flex-1 min-w-0 bg-zinc-800 text-sm text-white placeholder-zinc-500 px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
        <ImportMenu onImport={onImport} onImportFolder={onImportFolder} />
      </div>

      {/* View toggle */}
      <div className="px-3 py-1.5 border-b border-zinc-800 flex items-center gap-1">
        <button
          onClick={() => handleSetView("list")}
          className={`p-1 rounded ${view === "list" ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}
          title="List view"
        >
          <LayoutList size={14} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => handleSetView("table")}
          className={`p-1 rounded ${view === "table" ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}
          title="Table view"
        >
          <Table2 size={14} strokeWidth={1.5} />
        </button>

        {view === "table" && (
          <div className="ml-auto">
            <ColumnVisibilityMenu
              columns={TABLE_COLUMNS}
              visibility={columnVisibility}
              onChange={handleColumnVisibilityChange}
            />
          </div>
        )}
      </div>

      {view === "list" ? (
        <RecordingListView
          recordings={recordings}
          selectedId={selectedId}
          onSelect={onSelect}
          searchQuery={searchQuery}
          collections={collections}
          memberships={memberships}
          onToggleCollection={onToggleCollection}
        />
      ) : (
        <RecordingTableView
          recordings={recordings}
          selectedId={selectedId}
          onSelect={onSelect}
          searchQuery={searchQuery}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={handleColumnVisibilityChange}
        />
      )}
    </div>
  );
}
