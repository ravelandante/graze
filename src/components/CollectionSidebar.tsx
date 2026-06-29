import { useRef, useState } from "react";
import type { Collection } from "../types";

interface Props {
  collections: Collection[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onCreate: (name: string) => void;
}

export function CollectionSidebar({
  collections,
  selectedId,
  onSelect,
  onCreate,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full text-left px-4 py-2 text-sm truncate ${
              selectedId === c.id
                ? "bg-zinc-700 text-white"
                : "text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {c.name}
          </button>
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
