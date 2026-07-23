import { FolderOpen, Trash2 } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { Modal } from "@components/common/Modal";
import { useStore } from "@store";

interface Props {
  onClose: () => void;
}

export function WatchedFoldersModal({ onClose }: Props) {
  const watchedFolders = useStore((s) => s.watchedFolders);
  const addWatchedFolder = useStore((s) => s.addWatchedFolder);
  const removeWatchedFolder = useStore((s) => s.removeWatchedFolder);

  async function handleAdd() {
    const folder = await open({ directory: true });
    if (!folder || typeof folder !== "string") return;
    await addWatchedFolder(folder);
  }

  return (
    <Modal title="Watched Folders" onClose={onClose}>
      <div className="space-y-3">
        {watchedFolders.length === 0 ? (
          <p className="text-sm text-zinc-500 py-2">No watched folders yet.</p>
        ) : (
          <ul className="space-y-1">
            {watchedFolders.map((folder) => (
              <li
                key={folder}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 group"
              >
                <FolderOpen
                  size={13}
                  strokeWidth={1.75}
                  className="shrink-0 text-zinc-500"
                />
                <span
                  className="flex-1 text-sm text-zinc-300 truncate"
                  title={folder}
                >
                  {folder}
                </span>
                <button
                  onClick={() => removeWatchedFolder(folder)}
                  className="shrink-0 text-zinc-600 hover:text-red-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <Trash2 size={13} strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="pt-1 border-t border-zinc-800">
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2 py-1.5 rounded hover:bg-zinc-800 w-full"
          >
            <FolderOpen size={13} strokeWidth={1.75} />
            Add folder…
          </button>
        </div>
      </div>
    </Modal>
  );
}
