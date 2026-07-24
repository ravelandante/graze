import { Check, ChevronRight } from "lucide-react";
import { MENU_ITEM } from "@components/common/menu";

export function FilterRootRow({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`${MENU_ITEM} flex items-center justify-between gap-3`}
    >
      <span className="truncate">{label}</span>
      {active ? (
        <Check size={12} strokeWidth={2} className="shrink-0 text-zinc-400" />
      ) : (
        <ChevronRight
          size={12}
          strokeWidth={1.5}
          className="shrink-0 text-zinc-500"
        />
      )}
    </button>
  );
}
