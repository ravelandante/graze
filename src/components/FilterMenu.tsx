import { ListFilterPlus } from "lucide-react";
import { useEffect, useState } from "react";

export function FilterMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`text-xs px-1 py-0.5 rounded ${open ? "text-zinc-300" : "text-zinc-500 hover:text-zinc-300"}`}
      >
        <ListFilterPlus size={14} strokeWidth={1.5} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-zinc-800 border border-zinc-700 rounded shadow-xl py-1 min-w-40">
            <p className="px-3 py-1.5 text-xs text-zinc-500">No filters yet</p>
          </div>
        </>
      )}
    </div>
  );
}
