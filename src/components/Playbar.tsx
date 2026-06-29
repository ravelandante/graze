import { useState } from "react";
import type { Recording } from "../types";
import { Waveform } from "./Waveform";

interface Props {
  recording: Recording | null;
  audioEl: HTMLAudioElement;
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
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="1,10 1,14 5,14" />
      <polyline points="15,6 15,2 11,2" />
      <path d="M15,6 A6,6 0 1,0 11,2" />
      <path d="M1,10 A6,6 0 1,1 5,14" />
    </svg>
  );
}

function IconChevronUp() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="2,8 6,4 10,8" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="2,4 6,8 10,4" />
    </svg>
  );
}

const WAVEFORM_HEIGHT = 128;
const COMPACT_HEIGHT = 32;
const COMPACT_PAD = 3; // vertical padding (px) each side in compact mode

export function Playbar({
  recording,
  audioEl,
  isPlaying,
  isLooping,
  onTogglePlay,
  onNext,
  onToggleLoop,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="shrink-0 border-t border-zinc-800 bg-zinc-900 relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        className="absolute bottom-full right-2 bg-zinc-900 border border-b-0 border-zinc-800 text-zinc-600 hover:text-zinc-400 rounded-t px-2 py-0.5 flex items-center"
        title={expanded ? "Collapse waveform" : "Expand waveform"}
      >
        {expanded ? <IconChevronDown /> : <IconChevronUp />}
      </button>

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

      {/* Controls row */}
      <div className="h-12 flex items-center px-4 gap-4 border-t border-zinc-800">
        {/* Track info */}
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

        {/* Play / Next */}
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
    </div>
  );
}
