import { useState } from "react";
import { LayoutList, Table2 } from "lucide-react";
import type { Collection, Recording } from "../types";
import { RecordingListView } from "./RecordingListView";
import { RecordingTableView } from "./RecordingTableView";

interface Props {
  recordings: Recording[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onImport: () => void;
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

export function RecordingList({
  recordings,
  selectedId,
  onSelect,
  onImport,
  searchQuery,
  onSearchChange,
  collections,
  memberships,
  onToggleCollection,
}: Props) {
  const [view, setView] = useState<"list" | "table">("list");

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
        <button
          onClick={onImport}
          className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-3 py-1.5 rounded shrink-0"
        >
          Import
        </button>
      </div>

      {/* View toggle */}
      <div className="px-3 py-1.5 border-b border-zinc-800 flex items-center gap-1">
        <button
          onClick={() => setView("list")}
          className={`p-1 rounded ${view === "list" ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}
          title="List view"
        >
          <LayoutList size={14} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => setView("table")}
          className={`p-1 rounded ${view === "table" ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}
          title="Table view"
        >
          <Table2 size={14} strokeWidth={1.5} />
        </button>
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
        />
      )}
    </div>
  );
}
