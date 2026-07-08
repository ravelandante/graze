import { useState } from "react";
import { WatchedFoldersModal } from "./WatchedFoldersModal";
import { open } from "@tauri-apps/plugin-dialog";
import { readDir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { ColumnVisibilityMenu } from "./ColumnVisibilityMenu";
import { ImportMenu } from "./ImportMenu";
import type { Recording } from "../types";
import { RecordingTableView } from "./RecordingTableView";
import { loadSetting, saveSetting } from "../lib/settings";
import { useStore } from "../store";

interface Props {
  visibleRecordings: Recording[];
}

const TABLE_COLUMNS = [
  { id: "title", label: "Title" },
  { id: "fileName", label: "Filename" },
  { id: "originator", label: "Device" },
  { id: "timeRef", label: "TimeRef" },
];

export function RecordingList({ visibleRecordings }: Props) {
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const importRecordings = useStore((s) => s.importRecordings);
  const addWatchedFolder = useStore((s) => s.addWatchedFolder);
  const setStatus = useStore((s) => s.setStatus);

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(() => loadSetting("tableColumnVisibility", {}));
  const [watchedFoldersOpen, setWatchedFoldersOpen] = useState(false);

  function handleColumnVisibilityChange(next: Record<string, boolean>) {
    setColumnVisibility(next);
    saveSetting("tableColumnVisibility", next);
  }

  async function handleImport() {
    const paths = await open({
      multiple: true,
      filters: [{ name: "Audio", extensions: ["wav", "mp3"] }],
    });
    if (!paths) return;
    await importRecordings(Array.isArray(paths) ? paths : [paths]);
  }

  async function handleImportFolder() {
    const folder = await open({ directory: true });
    if (!folder || typeof folder !== "string") return;
    const entries = await readDir(folder);
    const filePaths = await Promise.all(
      entries
        .filter((e) => e.isFile && /\.(wav|mp3)$/i.test(e.name))
        .map((e) => join(folder, e.name)),
    );
    if (filePaths.length === 0) {
      setStatus("No audio files found in folder");
      setTimeout(() => setStatus(null), 3000);
      return;
    }
    await importRecordings(filePaths);
  }

  async function handleWatchFolder() {
    const folder = await open({ directory: true });
    if (!folder || typeof folder !== "string") return;
    await addWatchedFolder(folder);
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="px-3 py-2 border-b border-zinc-800 flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search recordings…"
          className="flex-1 min-w-0 bg-zinc-800 text-sm text-white placeholder-zinc-500 px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
        <ImportMenu
          onImport={handleImport}
          onImportFolder={handleImportFolder}
          onWatchFolder={handleWatchFolder}
          onManageWatchedFolders={() => setWatchedFoldersOpen(true)}
        />
      </div>
      <div className="px-3 py-1.5 border-b border-zinc-800 flex items-center gap-1">
        <div className="ml-auto">
          <ColumnVisibilityMenu
            columns={TABLE_COLUMNS}
            visibility={columnVisibility}
            onChange={handleColumnVisibilityChange}
          />
        </div>
      </div>
      {watchedFoldersOpen && (
        <WatchedFoldersModal onClose={() => setWatchedFoldersOpen(false)} />
      )}
      <RecordingTableView
        recordings={visibleRecordings}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
      />
    </div>
  );
}
