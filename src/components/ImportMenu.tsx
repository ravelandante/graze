import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  onImport: () => void;
  onImportFolder: () => void;
  onWatchFolder: () => void;
  onManageWatchedFolders: () => void;
}

export function ImportMenu({
  onImport,
  onImportFolder,
  onWatchFolder,
  onManageWatchedFolders,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-3 py-1.5 rounded"
      >
        Import
        <ChevronDown size={11} strokeWidth={2} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded shadow-xl min-w-35 z-30">
            <button
              onClick={() => {
                setOpen(false);
                onImport();
              }}
              className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
            >
              Import files
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onImportFolder();
              }}
              className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
            >
              Import folder
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onWatchFolder();
              }}
              className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
            >
              Watch folder
            </button>
            <hr className="border-zinc-700" />
            <button
              onClick={() => {
                setOpen(false);
                onManageWatchedFolders();
              }}
              className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
            >
              Manage watched folders
            </button>
          </div>
        </>
      )}
    </div>
  );
}
