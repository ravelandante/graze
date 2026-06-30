import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Recording } from "../types";
import { Waveform } from "./Waveform";
import { PlayControls } from "./PlayControls";
import { useTrim } from "../hooks/useTrim";
import { formatTime } from "../lib/format";

interface Props {
  recording: Recording | null;
  audioEl: HTMLAudioElement;
  isPlaying: boolean;
  isLooping: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onToggleLoop: () => void;
  onTrim?: (start: number, end: number) => void;
}

const WAVEFORM_HEIGHT = 128;
const COMPACT_HEIGHT = 32;
const COMPACT_PAD = 3;

export function Playbar({
  recording,
  audioEl,
  isPlaying,
  isLooping,
  onTogglePlay,
  onNext,
  onToggleLoop,
  onTrim,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const {
    trimIn,
    trimOut,
    canTrim,
    handleWsReady,
    handleSetIn,
    handleSetOut,
    handleTrimApply,
    handleClear,
  } = useTrim(audioEl, recording, expanded, onTrim);

  useEffect(() => {
    const el = audioEl;
    function onTimeUpdate() {
      setCurrentTime(el.currentTime);
    }
    el.addEventListener("timeupdate", onTimeUpdate);
    return () => el.removeEventListener("timeupdate", onTimeUpdate);
  }, [audioEl]);

  return (
    <div className="shrink-0 border-t border-zinc-800 bg-zinc-900 relative">
      {/* Tabs above playbar */}
      <div className="absolute bottom-full right-2 flex items-end gap-1">
        {expanded && (
          <div className="flex items-stretch bg-zinc-900 border border-b-0 border-zinc-800 rounded-t text-xs overflow-hidden">
            <button
              onClick={handleSetIn}
              className="px-2 py-0.5 text-zinc-400 hover:text-white border-r border-zinc-800"
            >
              {trimIn !== null ? `In ${formatTime(trimIn)}` : "Set In"}
            </button>
            <button
              onClick={handleSetOut}
              className="px-2 py-0.5 text-zinc-400 hover:text-white border-r border-zinc-800"
            >
              {trimOut !== null ? `Out ${formatTime(trimOut)}` : "Set Out"}
            </button>
            <button
              onClick={handleTrimApply}
              disabled={!canTrim}
              className="px-2 py-0.5 text-zinc-400 hover:text-white border-r border-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Trim
            </button>
            <button
              onClick={handleClear}
              disabled={!canTrim}
              className="px-2 py-0.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="bg-zinc-900 border border-b-0 border-zinc-800 rounded-t px-2 py-0.5 text-zinc-600 hover:text-zinc-400 flex items-center"
          title={expanded ? "Collapse waveform" : "Expand waveform"}
        >
          {expanded ? (
            <ChevronDown size={12} strokeWidth={1.5} />
          ) : (
            <ChevronUp size={12} strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Waveform row */}
      <div
        className="overflow-hidden"
        style={{
          height: expanded ? WAVEFORM_HEIGHT : COMPACT_HEIGHT + COMPACT_PAD * 2,
          paddingTop: COMPACT_PAD,
          paddingBottom: COMPACT_PAD,
          transition: "height 0.15s ease",
        }}
      >
        {recording ? (
          <Waveform
            key={recording.filePath}
            filePath={recording.filePath}
            height={expanded ? WAVEFORM_HEIGHT : COMPACT_HEIGHT}
            audioEl={audioEl}
            onReady={handleWsReady}
          />
        ) : (
          <div
            style={{ height: expanded ? WAVEFORM_HEIGHT : COMPACT_HEIGHT }}
            className="flex items-center px-4"
          >
            <div className="w-full h-px bg-zinc-800" />
          </div>
        )}
      </div>

      <PlayControls
        recording={recording}
        currentTime={currentTime}
        isPlaying={isPlaying}
        isLooping={isLooping}
        onTogglePlay={onTogglePlay}
        onNext={onNext}
        onToggleLoop={onToggleLoop}
      />
    </div>
  );
}
