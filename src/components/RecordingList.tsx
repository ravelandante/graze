import type { Recording } from "../types";

interface Props {
  recordings: Recording[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onImport: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RecordingList({
  recordings,
  selectedId,
  onSelect,
  onImport,
  searchQuery,
  onSearchChange,
}: Props) {
  return (
    <div className="flex flex-col h-full w-72 shrink-0 border-r border-zinc-800">
      <div className="px-3 py-2 border-b border-zinc-800 flex gap-2">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search recordings…"
          className="flex-1 bg-zinc-800 text-sm text-white placeholder-zinc-500 px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
        <button
          onClick={onImport}
          className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-3 py-1.5 rounded"
        >
          Import
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {recordings.length === 0 && (
          <li className="text-zinc-500 text-sm text-center py-10 px-4">
            {searchQuery ? "No results" : "Import recordings to get started"}
          </li>
        )}
        {recordings.map((r) => (
          <li key={r.id}>
            <button
              onClick={() => onSelect(r.id)}
              className={`w-full text-left px-4 py-3 border-b border-zinc-800 ${
                selectedId === r.id ? "bg-zinc-700" : "hover:bg-zinc-800"
              }`}
            >
              <p
                className={`text-sm font-medium truncate ${r.title ? "text-white" : "text-zinc-400"}`}
              >
                {r.title ?? "No title"}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">
                {r.fileName}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5 flex gap-2">
                <span>{r.originator ?? "Unknown device"}</span>
                <span>{formatDuration(r.durationSeconds)}</span>
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
