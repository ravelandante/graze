import {
  ChevronsRight,
  Pause,
  Play,
  Repeat,
  SkipForward,
  Square,
} from "lucide-react";
import type { Recording } from "../types";
import { formatTime } from "../lib/format";

interface Props {
  recording: Recording | null;
  currentTime: number;
  isPlaying: boolean;
  isLooping: boolean;
  isAutoAdvance: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  onNext: () => void;
  onToggleLoop: () => void;
  onToggleAutoAdvance: () => void;
}

export function PlayControls({
  recording,
  currentTime,
  isPlaying,
  isLooping,
  isAutoAdvance,
  onTogglePlay,
  onStop,
  onNext,
  onToggleLoop,
  onToggleAutoAdvance,
}: Props) {
  return (
    <div className="h-12 flex items-center px-4 gap-4 border-t border-zinc-800">
      {/* Track info + timer */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {recording ? (
            <>
              <p
                className={`text-sm font-medium truncate ${recording.title ? "text-white" : "text-zinc-500"}`}
              >
                {recording.title ?? "No title"}
              </p>
              <p className="text-xs text-zinc-500 truncate">
                {recording.fileName}
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-600">No recording selected</p>
          )}
        </div>
        <span className="text-xs tabular-nums text-zinc-500 shrink-0">
          {recording
            ? `${formatTime(currentTime)} / ${formatTime(recording.durationSeconds ?? 0)}`
            : "0:00 / 0:00"}
        </span>
      </div>

      {/* Stop / Play / Next */}
      <div className="flex items-center gap-3">
        <button
          onClick={onStop}
          disabled={!recording}
          className="text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Stop"
        >
          <Square size={16} strokeWidth={1.5} />
        </button>

        <button
          onClick={onTogglePlay}
          disabled={!recording}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-zinc-900 hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isPlaying ? (
            <Pause size={16} fill="currentColor" strokeWidth={0} />
          ) : (
            <Play size={16} fill="currentColor" strokeWidth={0} />
          )}
        </button>

        <button
          onClick={onNext}
          disabled={!recording}
          className="text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next"
        >
          <SkipForward size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Auto-advance + Loop */}
      <div className="flex-1 flex justify-end gap-1">
        <button
          onClick={onToggleAutoAdvance}
          className={`p-1.5 rounded ${isAutoAdvance ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}
          title="Auto-advance"
        >
          <ChevronsRight size={16} strokeWidth={1.5} />
        </button>
        <button
          onClick={onToggleLoop}
          className={`p-1.5 rounded ${isLooping ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}
          title="Loop"
        >
          <Repeat size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
