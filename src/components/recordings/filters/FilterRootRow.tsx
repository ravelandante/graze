import { Check, ChevronRight } from "lucide-react";

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
      className="w-full text-left px-2.5 py-1 text-sm text-zinc-200 hover:bg-zinc-700 flex items-center justify-between gap-3"
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
