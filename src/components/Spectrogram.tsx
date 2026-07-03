import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import SpectrogramPlugin from "wavesurfer.js/plugins/spectrogram";
import { convertFileSrc } from "@tauri-apps/api/core";

interface Props {
  filePath: string;
  height: number;
  audioEl: HTMLAudioElement;
}

export function Spectrogram({ filePath, height, audioEl }: Props) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const spectrogramRef = useRef<HTMLDivElement>(null);
  const audioElRef = useRef(audioEl);
  const [cursorPct, setCursorPct] = useState(() =>
    audioEl.duration ? (audioEl.currentTime / audioEl.duration) * 100 : 0,
  );

  useEffect(() => {
    audioElRef.current = audioEl;
  }, [audioEl]);

  useEffect(() => {
    function onTimeUpdate() {
      if (audioEl.duration) {
        setCursorPct((audioEl.currentTime / audioEl.duration) * 100);
      }
    }
    audioEl.addEventListener("timeupdate", onTimeUpdate);
    return () => audioEl.removeEventListener("timeupdate", onTimeUpdate);
  }, [audioEl]);

  useEffect(() => {
    if (!waveformRef.current || !spectrogramRef.current) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      height: 1,
      waveColor: "transparent",
      progressColor: "transparent",
      cursorColor: "transparent",
      url: convertFileSrc(filePath),
    });

    ws.registerPlugin(
      SpectrogramPlugin.create({
        container: spectrogramRef.current,
        height: height - 1,
        labels: false,
        colorMap: "roseus",
        scale: "mel",
      }),
    );

    ws.on("ready", () => {
      const el = audioElRef.current;
      if (el?.duration) ws.seekTo(el.currentTime / el.duration);
    });

    return () => {
      ws.destroy();
    };
  }, [filePath, height]);

  function handleClick(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const el = audioElRef.current;
    if (el.duration) el.currentTime = ratio * el.duration;
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <div
        ref={waveformRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          overflow: "hidden",
        }}
      />
      <div
        ref={spectrogramRef}
        className="w-full"
        style={{ height: height - 1, marginTop: 1, cursor: "pointer" }}
        onClick={handleClick}
      />
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          left: `${cursorPct}%`,
          width: 1,
          background: "rgba(228,228,231,0.5)",
          zIndex: 10,
        }}
      />
    </div>
  );
}
