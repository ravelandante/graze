import { useRef, useState } from "react";
import { Pencil, Trash } from "lucide-react";
import type { Collection } from "../types";

interface Props {
  collections: Collection[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onCreate: (name: string) => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

export function CollectionSidebar({
  collections,
  selectedId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  function startCreating() {
    setDraft("");
    setCreating(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commit() {
    const name = draft.trim();
    setCreating(false);
    setDraft("");
    if (name) onCreate(name);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      setCreating(false);
      setDraft("");
    }
  }

  function startRenaming(c: Collection) {
    setRenamingId(c.id);
    setRenameDraft(c.name);
  }

  function commitRename() {
    const name = renameDraft.trim();
    const id = renamingId;
    setRenamingId(null);
    setRenameDraft("");
    if (id !== null && name) onRename(id, name);
  }

  function handleRenameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitRename();
    if (e.key === "Escape") {
      setRenamingId(null);
      setRenameDraft("");
    }
  }

  return (
    <aside className="w-52 shrink-0 border-r border-zinc-800 flex flex-col h-full">
      <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Collections
        </span>
        <button
          onClick={startCreating}
          className="text-zinc-400 hover:text-white text-lg leading-none"
          title="New collection"
        >
          +
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-1">
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-4 py-2 text-sm truncate ${
            selectedId === null
              ? "bg-zinc-700 text-white"
              : "text-zinc-300 hover:bg-zinc-800"
          }`}
        >
          All recordings
        </button>

        {collections.map((c) => (
          <div
            key={c.id}
            className={`group flex items-center ${
              selectedId === c.id ? "bg-zinc-700" : "hover:bg-zinc-800"
            }`}
          >
            {renamingId === c.id ? (
              <input
                autoFocus
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={handleRenameKeyDown}
                className="flex-1 min-w-0 px-4 py-2 text-sm bg-transparent text-white focus:outline-none"
              />
            ) : (
              <>
                <button
                  onClick={() => onSelect(c.id)}
                  className={`flex-1 text-left px-4 py-2 text-sm truncate min-w-0 ${
                    selectedId === c.id ? "text-white" : "text-zinc-300"
                  }`}
                >
                  {c.name}
                </button>
                <div className="shrink-0 flex items-center gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRenaming(c);
                    }}
                    className="text-zinc-500 hover:text-zinc-200 p-0.5"
                    title="Rename collection"
                  >
                    <Pencil size={12} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(c.id);
                    }}
                    className="text-zinc-500 hover:text-red-400 p-0.5"
                    title="Delete collection"
                  >
                    <Trash size={12} strokeWidth={1.5} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {creating && (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            placeholder="Collection name"
            className="w-full px-4 py-2 text-sm bg-zinc-800 text-white placeholder-zinc-600 focus:outline-none"
          />
        )}
      </nav>
    </aside>
  );
}
