import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { convertFileSrc } from "@tauri-apps/api/core";

interface Props {
  filePath: string;
  height?: number;
  peaks?: number[][];
  duration?: number;
  audioEl?: HTMLAudioElement;
  onReady?: (ws: WaveSurfer) => void;
  channelCount?: number;
}

export function Waveform({
  filePath,
  height = 64,
  peaks,
  duration,
  audioEl,
  onReady,
  channelCount = 1,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const audioElRef = useRef(audioEl);
  const onReadyRef = useRef(onReady);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    audioElRef.current = audioEl;
  }, [audioEl]);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (!containerRef.current) return;
    wsRef.current?.destroy();
    setLoading(true);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#71717a",
      progressColor: "#e4e4e7",
      cursorColor: "#a1a1aa",
      barWidth: 2,
      barGap: 1,
      height: Math.floor(height / channelCount),
      normalize: true,
      url: convertFileSrc(filePath),
      ...(peaks && duration != null ? { peaks, duration } : {}),
      ...(channelCount > 1
        ? {
            splitChannels: Array.from({ length: channelCount }, () => ({
              waveColor: "#71717a",
              progressColor: "#e4e4e7",
              cursorColor: "#a1a1aa",
            })),
          }
        : {}),
    });

    let onTimeUpdate: (() => void) | null = null;

    ws.on("ready", () => {
      setLoading(false);
      const el = audioElRef.current;
      if (el) {
        onTimeUpdate = () => {
          if (el.duration) ws.seekTo(el.currentTime / el.duration);
        };
        el.addEventListener("timeupdate", onTimeUpdate);

        ws.on("interaction", (newTime: number) => {
          if (el.duration) el.currentTime = newTime;
        });

        onTimeUpdate();
      }
      onReadyRef.current?.(ws);
    });

    wsRef.current = ws;
    return () => {
      if (onTimeUpdate)
        audioElRef.current?.removeEventListener("timeupdate", onTimeUpdate);
      ws.destroy();
    };
  }, [filePath, height, peaks, duration, channelCount]);

  return (
    <div className="relative w-full" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 animate-pulse rounded bg-zinc-800" />
      )}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
