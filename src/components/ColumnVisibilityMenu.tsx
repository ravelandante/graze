import { useState } from "react";
import { Columns3 } from "lucide-react";

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
          <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded shadow-lg py-1 z-30 min-w-36">
            {columns.map((col) => {
              const visible = visibility[col.id] !== false;
              return (
                <label
                  key={col.id}
                  className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-zinc-700 text-xs text-zinc-300"
                >
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => onChange({ ...visibility, [col.id]: !visible })}
                    className="accent-zinc-400"
                  />
                  {col.label}
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
