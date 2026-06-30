import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import type { Recording } from "../types";
import { formatTimeReference } from "../lib/format";

interface Props {
  recordings: Recording[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  searchQuery: string;
}

const col = createColumnHelper<Recording>();

const columns = [
  col.accessor("title", {
    header: "Title",
    cell: (info) => {
      const value = info.getValue();
      return (
        <p className={`truncate ${value ? "text-white" : "text-zinc-500"}`}>
          {value ?? "No title"}
        </p>
      );
    },
  }),
  col.accessor("fileName", {
    header: "Filename",
    cell: (info) => (
      <p className="truncate text-zinc-400">{info.getValue()}</p>
    ),
  }),
  col.accessor("originator", {
    header: "Device",
    cell: (info) => (
      <p className="truncate text-zinc-400">{info.getValue() ?? "—"}</p>
    ),
  }),
  col.display({
    id: "timeRef",
    header: "TimeRef",
    cell: (info) => (
      <span className="tabular-nums text-zinc-400">
        {formatTimeReference(
          info.row.original.timeReference,
          info.row.original.sampleRate,
        )}
      </span>
    ),
  }),
];

export function RecordingTableView({
  recordings,
  selectedId,
  onSelect,
  searchQuery,
}: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: recordings,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-zinc-800">
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    className="text-left text-zinc-500 font-medium px-3 py-2 whitespace-nowrap"
                  >
                    {canSort ? (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 hover:text-zinc-300"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === "asc" ? (
                          <ChevronUp size={11} strokeWidth={2} />
                        ) : sorted === "desc" ? (
                          <ChevronDown size={11} strokeWidth={2} />
                        ) : (
                          <ChevronsUpDown size={11} strokeWidth={1.5} className="opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onSelect(row.original.id)}
              className={`border-b border-zinc-800 cursor-pointer ${
                selectedId === row.original.id ? "bg-zinc-700" : "hover:bg-zinc-800"
              }`}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-3 py-2 max-w-0 whitespace-nowrap"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
