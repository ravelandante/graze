import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { convertFileSrc } from "@tauri-apps/api/core";

interface Props {
  filePath: string;
  onReady?: (ws: WaveSurfer) => void;
}

export function Waveform({ filePath, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);

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
      height: 64,
      normalize: true,
      url: convertFileSrc(filePath),
    });

    ws.on("ready", () => onReady?.(ws));
    wsRef.current = ws;

    return () => ws.destroy();
  }, [filePath]);

  return <div ref={containerRef} className="w-full" />;
}
