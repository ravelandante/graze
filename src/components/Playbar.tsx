import type { Recording } from "../types";

interface Props {
  recording: Recording | null;
  isPlaying: boolean;
  isLooping: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onToggleLoop: () => void;
}

function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <polygon points="3,1 15,8 3,15" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="2" y="1" width="5" height="14" rx="1" />
      <rect x="9" y="1" width="5" height="14" rx="1" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <polygon points="1,1 11,8 1,15" />
      <rect x="12" y="1" width="3" height="14" rx="1" />
    </svg>
  );
}

function IconLoop() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,10 1,14 5,14" />
      <polyline points="15,6 15,2 11,2" />
      <path d="M15,6 A6,6 0 1,0 11,2" />
      <path d="M1,10 A6,6 0 1,1 5,14" />
    </svg>
  );
}

export function Playbar({ recording, isPlaying, isLooping, onTogglePlay, onNext, onToggleLoop }: Props) {
  return (
    <div className="h-14 shrink-0 border-t border-zinc-800 bg-zinc-900 flex items-center px-4 gap-4">
      {/* Track info */}
      <div className="flex-1 min-w-0">
        {recording ? (
          <>
            <p className={`text-sm font-medium truncate ${recording.title ? "text-white" : "text-zinc-500"}`}>
              {recording.title ?? "No title"}
            </p>
            <p className="text-xs text-zinc-500 truncate">{recording.fileName}</p>
          </>
        ) : (
          <p className="text-sm text-zinc-600">No recording selected</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onTogglePlay}
          disabled={!recording}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-zinc-900 hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isPlaying ? <IconPause /> : <IconPlay />}
        </button>

        <button
          onClick={onNext}
          disabled={!recording}
          className="text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next"
        >
          <IconNext />
        </button>
      </div>

      {/* Loop */}
      <div className="flex-1 flex justify-end">
        <button
          onClick={onToggleLoop}
          className={`p-1.5 rounded ${isLooping ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}
          title="Loop"
        >
          <IconLoop />
        </button>
      </div>
    </div>
  );
}
