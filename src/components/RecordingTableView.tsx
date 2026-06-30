import type { Recording } from "../types";
import { formatTimeReference } from "../lib/format";

interface Props {
  recordings: Recording[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  searchQuery: string;
}

export function RecordingTableView({
  recordings,
  selectedId,
  onSelect,
  searchQuery,
}: Props) {
  if (recordings.length === 0) {
    return (
      <p className="text-zinc-500 text-sm text-center py-10 px-4">
        {searchQuery ? "No results" : "Import recordings to get started"}
      </p>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 bg-zinc-900 z-10">
          <tr className="border-b border-zinc-800">
            <th className="text-left text-zinc-500 font-medium px-3 py-2 whitespace-nowrap">Title</th>
            <th className="text-left text-zinc-500 font-medium px-3 py-2 whitespace-nowrap">Filename</th>
            <th className="text-left text-zinc-500 font-medium px-3 py-2 whitespace-nowrap">Device</th>
            <th className="text-left text-zinc-500 font-medium px-3 py-2 whitespace-nowrap">TimeRef</th>
          </tr>
        </thead>
        <tbody>
          {recordings.map((r) => (
            <tr
              key={r.id}
              onClick={() => onSelect(r.id)}
              className={`border-b border-zinc-800 cursor-pointer ${
                selectedId === r.id ? "bg-zinc-700" : "hover:bg-zinc-800"
              }`}
            >
              <td className="px-3 py-2 max-w-0">
                <p className={`truncate ${r.title ? "text-white" : "text-zinc-500"}`}>
                  {r.title ?? "No title"}
                </p>
              </td>
              <td className="px-3 py-2 max-w-0">
                <p className="truncate text-zinc-400">{r.fileName}</p>
              </td>
              <td className="px-3 py-2 max-w-0">
                <p className="truncate text-zinc-400">{r.originator ?? "—"}</p>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-zinc-400 tabular-nums">
                {formatTimeReference(r.timeReference, r.sampleRate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
