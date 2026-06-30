import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { loadSetting, saveSetting } from "../lib/settings";
import type { Recording } from "../types";
import { Waveform } from "./Waveform";
import { PlayControls } from "./PlayControls";
import { TrimTab } from "./TrimTab";
import { NormalizeTab } from "./NormalizeTab";
import { useTrim } from "../hooks/useTrim";

interface Props {
  recording: Recording | null;
  audioEl: HTMLAudioElement;
  currentTime: number;
  isPlaying: boolean;
  isLooping: boolean;
  isAutoAdvance: boolean;
  isAutoplay: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  onNext: () => void;
  onToggleLoop: () => void;
  onToggleAutoAdvance: () => void;
  onToggleAutoplay: () => void;
  onNormalize?: () => void;
  onTrim?: (start: number, end: number) => void;
}

const COMPACT_HEIGHT = 32;

export function Playbar({
  recording,
  audioEl,
  currentTime,
  isPlaying,
  isLooping,
  isAutoAdvance,
  isAutoplay,
  onTogglePlay,
  onStop,
  onNext,
  onToggleLoop,
  onToggleAutoAdvance,
  onToggleAutoplay,
  onNormalize,
  onTrim,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [waveformHeight, setWaveformHeight] = useState(() =>
    loadSetting("waveformHeight", 128),
  );
  const [maxWaveformHeight] = useState(() =>
    Math.floor(window.innerHeight / 3),
  );
  const [isHeightDragging, setIsHeightDragging] = useState(false);

  function startHeightResize(e: React.MouseEvent) {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = waveformHeight;
    let lastHeight = startHeight;

    setIsHeightDragging(true);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    function onMouseMove(ev: MouseEvent) {
      lastHeight = Math.max(
        64,
        Math.min(maxWaveformHeight, startHeight + startY - ev.clientY),
      );
      setWaveformHeight(lastHeight);
    }

    function onMouseUp() {
      setIsHeightDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      saveSetting("waveformHeight", lastHeight);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

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

  const displayHeight = expanded ? waveformHeight : COMPACT_HEIGHT;
  const scale = displayHeight / maxWaveformHeight;
  const easing = isHeightDragging ? undefined : "0.15s ease";

  return (
    <div className="shrink-0 bg-zinc-900 relative">
      {expanded ? (
        <div
          onMouseDown={startHeightResize}
          className="h-1 bg-zinc-800 hover:bg-zinc-600 cursor-row-resize transition-colors"
        />
      ) : (
        <div className="h-px bg-zinc-800" />
      )}

      {/* Tabs above playbar */}
      <div className="absolute bottom-full right-2 flex items-end gap-1">
        {expanded && onNormalize && <NormalizeTab onNormalize={onNormalize} />}
        {expanded && (
          <TrimTab
            trimIn={trimIn}
            trimOut={trimOut}
            canTrim={canTrim}
            onSetIn={handleSetIn}
            onSetOut={handleSetOut}
            onTrim={handleTrimApply}
            onClear={handleClear}
          />
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
          height: displayHeight,
          transition: easing ? `height ${easing}` : undefined,
        }}
      >
        <div
          style={{
            height: maxWaveformHeight,
            transform: `scaleY(${scale})`,
            transformOrigin: "top",
            transition: easing ? `transform ${easing}` : undefined,
          }}
        >
          {recording ? (
            <Waveform
              key={recording.filePath}
              filePath={recording.filePath}
              height={maxWaveformHeight}
              audioEl={audioEl}
              onReady={handleWsReady}
            />
          ) : (
            <div
              style={{ height: maxWaveformHeight }}
              className="flex items-center px-4"
            >
              <div className="w-full h-px bg-zinc-800" />
            </div>
          )}
        </div>
      </div>

      <PlayControls
        recording={recording}
        currentTime={currentTime}
        isPlaying={isPlaying}
        isLooping={isLooping}
        isAutoAdvance={isAutoAdvance}
        isAutoplay={isAutoplay}
        onTogglePlay={onTogglePlay}
        onStop={onStop}
        onNext={onNext}
        onToggleLoop={onToggleLoop}
        onToggleAutoAdvance={onToggleAutoAdvance}
        onToggleAutoplay={onToggleAutoplay}
      />
    </div>
  );
}
