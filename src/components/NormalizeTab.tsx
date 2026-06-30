interface Props {
  onNormalize: () => void;
}

export function NormalizeTab({ onNormalize }: Props) {
  return (
    <div className="flex items-stretch bg-zinc-900 border border-b-0 border-zinc-800 rounded-t text-xs overflow-hidden">
      <button
        onClick={onNormalize}
        className="px-2 py-0.5 text-zinc-400 hover:text-white"
      >
        Normalize
      </button>
    </div>
  );
}
