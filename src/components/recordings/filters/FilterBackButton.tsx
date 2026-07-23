import { ChevronLeft } from "lucide-react";

export function FilterBackButton({
  label,
  onBack,
}: {
  label: string;
  onBack: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onBack();
      }}
      className="w-full text-left px-2.5 py-1 text-xs text-zinc-500 hover:bg-zinc-700 flex items-center gap-1"
    >
      <ChevronLeft size={12} strokeWidth={1.5} />
      {label}
    </button>
  );
}
