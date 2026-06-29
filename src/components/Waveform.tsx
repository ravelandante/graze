import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { convertFileSrc } from "@tauri-apps/api/core";

interface Props {
  filePath: string;
  height?: number;
  /** When provided, WaveSurfer cursor tracks this element's playback position and seek clicks update it. */
  audioEl?: HTMLAudioElement;
  onReady?: (ws: WaveSurfer) => void;
}

export function Waveform({ filePath, height = 64, audioEl, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const audioElRef = useRef(audioEl);
  const onReadyRef = useRef(onReady);
  useEffect(() => { audioElRef.current = audioEl; }, [audioEl]);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

  useEffect(() => {
    if (!containerRef.current) return;
    wsRef.current?.destroy();

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#71717a",
      progressColor: "#e4e4e7",
      cursorColor: "#a1a1aa",
      barWidth: 2,
      barGap: 1,
      height,
      normalize: true,
      url: convertFileSrc(filePath),
    });

    let onTimeUpdate: (() => void) | null = null;

    ws.on("ready", () => {
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
      if (onTimeUpdate) audioElRef.current?.removeEventListener("timeupdate", onTimeUpdate);
      ws.destroy();
    };
  }, [filePath, height]);

  return <div ref={containerRef} className="w-full" />;
}
