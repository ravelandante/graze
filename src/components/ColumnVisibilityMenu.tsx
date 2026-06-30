import { useState } from "react";
import { Check, Columns3 } from "lucide-react";

interface ColumnDef {
  id: string;
  label: string;
}

interface Props {
  columns: ColumnDef[];
  visibility: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
}

export function ColumnVisibilityMenu({ columns, visibility, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`p-1 rounded ${open ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}
        title="Toggle columns"
      >
        <Columns3 size={14} strokeWidth={1.5} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-50 bg-zinc-800 border border-zinc-700 rounded shadow-xl min-w-40">
            {columns.map((col) => {
              const visible = visibility[col.id] !== false;
              return (
                <button
                  key={col.id}
                  onClick={() =>
                    onChange({ ...visibility, [col.id]: !visible })
                  }
                  className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 flex items-center justify-between gap-2"
                >
                  <span>{col.label}</span>
                  {visible && (
                    <Check
                      size={12}
                      strokeWidth={2}
                      className="shrink-0 text-zinc-400"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
