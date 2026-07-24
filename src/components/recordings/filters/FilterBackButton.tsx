import { ChevronLeft } from "lucide-react";
import { MENU_ITEM_MUTED } from "@components/common/menu";

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
      className={`${MENU_ITEM_MUTED} flex items-center gap-1`}
    >
      <ChevronLeft size={12} strokeWidth={1.5} />
      {label}
    </button>
  );
}
