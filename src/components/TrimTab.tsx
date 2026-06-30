import { formatTime } from "../lib/format";

interface Props {
  trimIn: number | null;
  trimOut: number | null;
  canTrim: boolean;
  onSetIn: () => void;
  onSetOut: () => void;
  onTrim: () => void;
  onClear: () => void;
}

export function TrimTab({
  trimIn,
  trimOut,
  canTrim,
  onSetIn,
  onSetOut,
  onTrim,
  onClear,
}: Props) {
  return (
    <div className="flex items-stretch bg-zinc-900 border border-b-0 border-zinc-800 rounded-t text-xs overflow-hidden">
      <button
        onClick={onSetIn}
        className="px-2 py-0.5 text-zinc-400 hover:text-white border-r border-zinc-800"
      >
        {trimIn !== null ? `In ${formatTime(trimIn)}` : "Set In"}
      </button>
      <button
        onClick={onSetOut}
        className="px-2 py-0.5 text-zinc-400 hover:text-white border-r border-zinc-800"
      >
        {trimOut !== null ? `Out ${formatTime(trimOut)}` : "Set Out"}
      </button>
      <button
        onClick={onTrim}
        disabled={!canTrim}
        className="px-2 py-0.5 text-zinc-400 hover:text-white border-r border-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Trim
      </button>
      <button
        onClick={onClear}
        disabled={!canTrim}
        className="px-2 py-0.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Clear
      </button>
    </div>
  );
}
