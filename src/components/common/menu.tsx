export const MENU_PANEL =
  "bg-zinc-800 border border-zinc-700 rounded shadow-xl";

export const MENU_ITEM =
  "w-full text-left px-2.5 py-1 text-sm text-zinc-200 hover:bg-zinc-700";

export const MENU_ITEM_DANGER =
  "w-full text-left px-2.5 py-1 text-sm text-red-400 hover:bg-zinc-700";

export const MENU_ITEM_MUTED =
  "w-full text-left px-2.5 py-1 text-xs text-zinc-500 hover:bg-zinc-700";

export function MenuSeparator() {
  return <hr className="border-zinc-700" />;
}
