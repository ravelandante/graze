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
  function handleNewCollection() {
    const name = window.prompt("Collection name:");
    if (name?.trim()) onCreate(name.trim());
  }

  return (
    <aside className="w-52 shrink-0 border-r border-zinc-800 flex flex-col h-full">
      <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Collections
        </span>
        <button
          onClick={handleNewCollection}
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
      </nav>
    </aside>
  );
}
