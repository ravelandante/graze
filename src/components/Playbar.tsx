import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  Repeat,
  SkipForward,
} from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/plugins/regions";
import type { Region } from "wavesurfer.js/plugins/regions";
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
  onTrim?: (start: number, end: number) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
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
  const [trimIn, setTrimIn] = useState<number | null>(null);
  const [trimOut, setTrimOut] = useState<number | null>(null);

  const trimInRef = useRef<number | null>(null);
  const trimOutRef = useRef<number | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const regionRef = useRef<Region | null>(null);

  useEffect(() => {
    const el = audioEl;
    function onTimeUpdate() {
      setCurrentTime(el.currentTime);
    }
    el.addEventListener("timeupdate", onTimeUpdate);
    return () => el.removeEventListener("timeupdate", onTimeUpdate);
  }, [audioEl]);

  useEffect(() => {
    if (!expanded) {
      regionRef.current?.remove();
      regionRef.current = null;
    }
  }, [expanded]);

  useEffect(() => {
    trimInRef.current = null;
    trimOutRef.current = null;
    setTrimIn(null);
    setTrimOut(null);
    regionRef.current = null;
    regionsRef.current = null;
  }, [recording?.filePath]);

  function attachRegionListeners(region: Region) {
    region.on("update-end", () => {
      trimInRef.current = region.start;
      trimOutRef.current = region.end;
      setTrimIn(region.start);
      setTrimOut(region.end);
    });
  }

  function updateRegion() {
    const regions = regionsRef.current;
    if (!regions) return;
    const inPt = trimInRef.current;
    const outPt = trimOutRef.current;
    if (inPt !== null && outPt !== null) {
      if (regionRef.current) {
        regionRef.current.setOptions({
          start: Math.min(inPt, outPt),
          end: Math.max(inPt, outPt),
        });
      } else {
        const region = regions.addRegion({
          start: Math.min(inPt, outPt),
          end: Math.max(inPt, outPt),
          color: "rgba(161, 161, 170, 0.18)",
          drag: true,
          resize: true,
        });
        attachRegionListeners(region);
        regionRef.current = region;
      }
    } else {
      regionRef.current?.remove();
      regionRef.current = null;
    }
  }

  function handleWsReady(ws: WaveSurfer) {
    regionRef.current = null;
    const regions = ws.registerPlugin(RegionsPlugin.create());
    regionsRef.current = regions;
    if (!expanded) return;
    const inPt = trimInRef.current;
    const outPt = trimOutRef.current;
    if (inPt !== null && outPt !== null) {
      const region = regions.addRegion({
        start: Math.min(inPt, outPt),
        end: Math.max(inPt, outPt),
        color: "rgba(161, 161, 170, 0.18)",
        drag: true,
        resize: true,
      });
      attachRegionListeners(region);
      regionRef.current = region;
    }
  }

  function handleSetIn() {
    trimInRef.current = audioEl.currentTime;
    setTrimIn(audioEl.currentTime);
    if (trimOutRef.current === null) {
      const end = recording?.durationSeconds ?? audioEl.duration ?? 0;
      trimOutRef.current = end;
      setTrimOut(end);
    }
    updateRegion();
  }

  function handleSetOut() {
    trimOutRef.current = audioEl.currentTime;
    setTrimOut(audioEl.currentTime);
    if (trimInRef.current === null) {
      trimInRef.current = 0;
      setTrimIn(0);
    }
    updateRegion();
  }

  function handleTrimApply() {
    const inPt = trimInRef.current;
    const outPt = trimOutRef.current;
    if (inPt !== null && outPt !== null) {
      onTrim?.(Math.min(inPt, outPt), Math.max(inPt, outPt));
    }
  }

  const canTrim = trimIn !== null && trimOut !== null;

  return (
    <div className="shrink-0 border-t border-zinc-800 bg-zinc-900 relative">
      {/* Tab above playbar */}
      <div className="absolute bottom-full right-2 flex items-stretch bg-zinc-900 border border-b-0 border-zinc-800 rounded-t text-xs overflow-hidden">
        {expanded && (
          <>
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
          </>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="px-2 py-0.5 text-zinc-600 hover:text-zinc-400 flex items-center"
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

      {/* Controls row */}
      <div className="h-12 flex items-center px-4 gap-4 border-t border-zinc-800">
        {/* Track info + timer (left flex-1) */}
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

        {/* Play / Next */}
        <div className="flex items-center gap-3">
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

        {/* Loop */}
        <div className="flex-1 flex justify-end">
          <button
            onClick={onToggleLoop}
            className={`p-1.5 rounded ${isLooping ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}
            title="Loop"
          >
            <Repeat size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
