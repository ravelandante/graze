import { Check } from "lucide-react";
import { MENU_ITEM, MenuSeparator } from "@components/common/menu";
import { FilterBackButton } from "./FilterBackButton";

export function FilterCollectionView({
  collections,
  selectedIds,
  onBack,
  onToggle,
}: {
  collections: { id: number; name: string }[];
  selectedIds: Set<number>;
  onBack: () => void;
  onToggle: (id: number) => void;
}) {
  return (
    <>
      <FilterBackButton label="Collection" onBack={onBack} />
      <MenuSeparator />
      {collections.length === 0 ? (
        <p className="px-2.5 py-1 text-xs text-zinc-500">No collections yet</p>
      ) : (
        collections.map((c) => (
          <button
            key={c.id}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(c.id);
            }}
            className={`${MENU_ITEM} flex items-center justify-between gap-3`}
          >
            <span className="truncate">{c.name}</span>
            {selectedIds.has(c.id) && (
              <Check
                size={12}
                strokeWidth={2}
                className="shrink-0 text-zinc-400"
              />
            )}
          </button>
        ))
      )}
    </>
  );
}
