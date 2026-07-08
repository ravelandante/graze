import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnSizingState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  FileExclamationPoint,
} from "lucide-react";
import { useState } from "react";
import type { Recording, RecordingColumnVisibility } from "../types";
import { formatTime, formatTimeReference } from "../lib/format";
import { useStore } from "../store";
import { RecordingContextMenu } from "./RecordingContextMenu";
import { useRecordingSelection } from "../hooks/useRecordingSelection";

interface Props {
  recordings: Recording[];
  columnVisibility: RecordingColumnVisibility;
  onColumnVisibilityChange: (next: RecordingColumnVisibility) => void;
}

const col = createColumnHelper<Recording>();

const columns = [
  col.accessor("title", {
    header: "Title",
    size: 200,
    minSize: 80,
    cell: (info) => {
      const value = info.getValue();
      const isMissing = info.row.original.status === "missing";
      return (
        <p
          className={`truncate ${value ? "text-white" : "text-zinc-500"} flex gap-1`}
        >
          {value ?? "No title"}
          {isMissing && (
            <span title="File missing">
              <FileExclamationPoint color="#FFC107" size={16} />
            </span>
          )}
        </p>
      );
    },
  }),
  col.accessor("fileName", {
    header: "Filename",
    size: 200,
    minSize: 80,
    cell: (info) => <p className="truncate text-zinc-400">{info.getValue()}</p>,
  }),
  col.accessor("originator", {
    header: "Device",
    size: 150,
    minSize: 60,
    cell: (info) => (
      <p className="truncate text-zinc-400">{info.getValue() ?? "—"}</p>
    ),
  }),
  col.display({
    id: "timeReference",
    header: "Time Reference",
    size: 120,
    minSize: 60,
    cell: (info) => (
      <span className="tabular-nums text-zinc-400">
        {formatTimeReference(
          info.row.original.timeReference,
          info.row.original.sampleRate,
          info.row.original.recordedAt,
        )}
      </span>
    ),
  }),
  col.accessor("durationSeconds", {
    header: "Duration",
    size: 70,
    minSize: 50,
    cell: (info) => {
      const v = info.getValue();
      return (
        <span className="tabular-nums text-zinc-400">
          {v != null ? formatTime(v) : "—"}
        </span>
      );
    },
  }),
  col.accessor("channels", {
    header: "Ch.",
    size: 45,
    minSize: 40,
    cell: (info) => (
      <span className="tabular-nums text-zinc-400">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),
  col.accessor("format", {
    header: "Format",
    size: 65,
    minSize: 50,
    cell: (info) => (
      <span className="text-zinc-400">
        {info.getValue()?.toUpperCase() ?? "—"}
      </span>
    ),
  }),
  col.accessor("bitDepth", {
    header: "Bit Depth",
    size: 80,
    minSize: 60,
    cell: (info) => {
      const v = info.getValue();
      return (
        <span className="tabular-nums text-zinc-400">
          {v != null ? `${v}-bit` : "—"}
        </span>
      );
    },
  }),
  col.accessor("sampleRate", {
    header: "Sample Rate",
    size: 95,
    minSize: 70,
    cell: (info) => {
      const v = info.getValue();
      return (
        <span className="tabular-nums text-zinc-400">
          {v != null ? `${v / 1000} kHz` : "—"}
        </span>
      );
    },
  }),
  col.accessor("importedAt", {
    header: "Imported",
    size: 90,
    minSize: 70,
    cell: (info) => (
      <span className="tabular-nums text-zinc-400">
        {info.getValue().split("T")[0]}
      </span>
    ),
  }),
];

export function RecordingTableView({
  recordings,
  columnVisibility,
  onColumnVisibilityChange,
}: Props) {
  const searchQuery = useStore((s) => s.searchQuery);
  const {
    selectedIds,
    handleClick,
    handleMouseDown,
    handleContextMenu,
    getDragProps,
  } = useRecordingSelection(recordings);

  const [contextMenu, setContextMenu] = useState<{
    recordingId: number;
    x: number;
    y: number;
  } | null>(null);

  function onContextMenu(e: React.MouseEvent, recordingId: number) {
    handleContextMenu(e, recordingId);
    setContextMenu({ recordingId, x: e.clientX, y: e.clientY });
  }

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);

  const table = useReactTable({
    data: recordings,
    columns,
    state: {
      sorting,
      columnSizing,
      columnVisibility: columnVisibility as VisibilityState,
    },
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater(columnVisibility as VisibilityState)
          : updater;
      onColumnVisibilityChange(next as RecordingColumnVisibility);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const totalSize = table
    .getVisibleFlatColumns()
    .reduce((sum, c) => sum + c.getSize(), 0);

  function makeResizeHandler(columnId: string) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;

      const visibleColumns = table.getVisibleFlatColumns();
      const idx = visibleColumns.findIndex((c) => c.id === columnId);
      const thisCol = visibleColumns[idx];
      const nextCol = visibleColumns[idx + 1];
      if (!thisCol) return;

      const startThisSize = thisCol.getSize();
      const startNextSize = nextCol?.getSize() ?? 0;
      const thisMinSize = (thisCol.columnDef.minSize ?? 40) as number;
      const nextMinSize = (nextCol?.columnDef.minSize ?? 40) as number;

      setResizingColumnId(columnId);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      function onMouseMove(ev: MouseEvent) {
        const delta = ev.clientX - startX;
        const maxDelta = nextCol ? startNextSize - nextMinSize : 9999;
        const minDelta = -(startThisSize - thisMinSize);
        const clamped = Math.max(minDelta, Math.min(maxDelta, delta));
        setColumnSizing((prev) => ({
          ...prev,
          [columnId]: startThisSize + clamped,
          ...(nextCol ? { [nextCol.id]: startNextSize - clamped } : {}),
        }));
      }

      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setResizingColumnId(null);
      }

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };
  }

  if (recordings.length === 0) {
    return (
      <p className="text-zinc-500 text-sm text-center py-10 px-4">
        {searchQuery ? "No results" : "Import recordings to get started"}
      </p>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table
        className="text-xs border-collapse w-full"
        style={{ tableLayout: "fixed" }}
      >
        <thead className="sticky top-0 bg-zinc-900 z-10">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-zinc-800">
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                const isResizing = resizingColumnId === header.column.id;
                return (
                  <th
                    key={header.id}
                    className="relative text-left text-zinc-500 font-medium px-3 py-2 whitespace-nowrap overflow-hidden"
                    style={{
                      width: `${(header.getSize() / totalSize) * 100}%`,
                    }}
                  >
                    {canSort ? (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 hover:text-zinc-300"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {sorted === "asc" ? (
                          <ChevronUp size={11} strokeWidth={2} />
                        ) : sorted === "desc" ? (
                          <ChevronDown size={11} strokeWidth={2} />
                        ) : (
                          <ChevronsUpDown
                            size={11}
                            strokeWidth={1.5}
                            className="opacity-40"
                          />
                        )}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                    <div
                      onMouseDown={makeResizeHandler(header.column.id)}
                      className={`absolute right-0 top-0 h-full w-4 cursor-col-resize select-none touch-none flex items-center justify-end pr-0.5 ${
                        isResizing
                          ? "opacity-100"
                          : "opacity-30 hover:opacity-100"
                      }`}
                    >
                      <div
                        className={`h-3/4 w-px ${isResizing ? "bg-zinc-300" : "bg-zinc-600"}`}
                      />
                    </div>
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
              onMouseDown={handleMouseDown}
              onClick={(e) => handleClick(e, row.original.id)}
              onContextMenu={(e) => onContextMenu(e, row.original.id)}
              {...getDragProps(row.original.id)}
              className={`border-b border-zinc-800 cursor-pointer select-none ${
                selectedIds.has(row.original.id)
                  ? "bg-zinc-700"
                  : "hover:bg-zinc-800"
              } ${row.original.status === "missing" ? "opacity-50" : ""}`}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-3 py-2 whitespace-nowrap overflow-hidden"
                  style={{
                    width: `${(cell.column.getSize() / totalSize) * 100}%`,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {contextMenu && (
        <RecordingContextMenu
          recordingId={contextMenu.recordingId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
