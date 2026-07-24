import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { MENU_ITEM, MENU_PANEL, MenuSeparator } from "@components/common/menu";

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
          <div
            className={`${MENU_PANEL} absolute right-0 top-full mt-1 min-w-35 z-30`}
          >
            <button
              onClick={() => {
                setOpen(false);
                onImport();
              }}
              className={MENU_ITEM}
            >
              Import files
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onImportFolder();
              }}
              className={MENU_ITEM}
            >
              Import folder
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onWatchFolder();
              }}
              className={MENU_ITEM}
            >
              Watch folder
            </button>
            <MenuSeparator />
            <button
              onClick={() => {
                setOpen(false);
                onManageWatchedFolders();
              }}
              className={MENU_ITEM}
            >
              Manage watched folders
            </button>
          </div>
        </>
      )}
    </div>
  );
}
