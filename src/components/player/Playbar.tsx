import { useState, useEffect } from "react";
import {
  AudioWaveform,
  ChevronDown,
  ChevronUp,
  Layers,
  Minus,
  Equal,
} from "lucide-react";
import { loadSetting, saveSetting } from "@lib/settings";
import { Waveform } from "./Waveform";
import { Spectrogram } from "./Spectrogram";
import { PlayControls } from "./PlayControls";
import { TrimTab } from "./TrimTab";
import { NormalizeTab } from "./NormalizeTab";
import { useTrim } from "@hooks/useTrim";
import { useStore } from "@store";

interface Props {
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
}

const COMPACT_HEIGHT = 32;

export function Playbar({
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
}: Props) {
  const recording = useStore(
    (s) => s.recordings.find((r) => r.id === s.selectedRecordingId) ?? null,
  );
  const peaks = useStore((s) =>
    s.selectedRecordingId != null
      ? (s.peaksCache.get(s.selectedRecordingId) ?? undefined)
      : undefined,
  );
  const loadPeaks = useStore((s) => s.loadPeaks);
  const selectedId = recording?.id ?? null;
  useEffect(() => {
    if (selectedId != null) void loadPeaks(selectedId);
  }, [selectedId, loadPeaks]);
  const normalizeRecording = useStore((s) => s.normalizeRecording);
  const trimRecording = useStore((s) => s.trimRecording);
  const [expanded, setExpanded] = useState(false);
  const [playbarMode, setPlaybarMode] = useState<"waveform" | "spectrogram">(
    () => loadSetting("playbarMode", "waveform"),
  );
  const [stereo, setStereo] = useState(true);
  const isStereo = (recording?.channels ?? 1) > 1;
  const [waveformHeight, setWaveformHeight] = useState(() =>
    loadSetting("waveformHeight", 128),
  );
  const [maxWaveformHeight, setMaxWaveformHeight] = useState(() =>
    Math.floor(window.innerHeight / 2),
  );
  useEffect(() => {
    function onResize() {
      setMaxWaveformHeight(Math.floor(window.innerHeight / 2));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
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
  } = useTrim(audioEl, recording, expanded, trimRecording);

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
        {expanded && recording && (
          <NormalizeTab onNormalize={normalizeRecording} />
        )}
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
            setStereo((v) => !v);
          }}
          disabled={!isStereo}
          className="bg-zinc-900 border border-b-0 border-zinc-800 rounded-t px-2 py-0.5 flex items-center text-zinc-600 hover:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed"
          title={
            !isStereo
              ? "Mono recording"
              : stereo
                ? "Switch to mono"
                : "Switch to stereo"
          }
        >
          {stereo && isStereo ? (
            <Equal size={12} strokeWidth={1.5} />
          ) : (
            <Minus size={12} strokeWidth={1.5} />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const next =
              playbarMode === "waveform" ? "spectrogram" : "waveform";
            setPlaybarMode(next);
            saveSetting("playbarMode", next);
          }}
          className="bg-zinc-900 border border-b-0 border-zinc-800 rounded-t px-2 py-0.5 flex items-center text-zinc-600 hover:text-zinc-400"
          title={
            playbarMode === "waveform"
              ? "Switch to spectrogram"
              : "Switch to waveform"
          }
        >
          {playbarMode === "waveform" ? (
            <Layers size={12} strokeWidth={1.5} />
          ) : (
            <AudioWaveform size={12} strokeWidth={1.5} />
          )}
        </button>
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
          {recording && playbarMode === "waveform" ? (
            <Waveform
              key={recording.filePath}
              filePath={recording.filePath}
              height={maxWaveformHeight}
              peaks={peaks}
              duration={recording.durationSeconds ?? undefined}
              audioEl={audioEl}
              onReady={handleWsReady}
              channelCount={stereo && isStereo ? (recording.channels ?? 1) : 1}
            />
          ) : recording && playbarMode === "spectrogram" ? (
            <Spectrogram
              key={recording.filePath}
              filePath={recording.filePath}
              height={maxWaveformHeight}
              audioEl={audioEl}
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
