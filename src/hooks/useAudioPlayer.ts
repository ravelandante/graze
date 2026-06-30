import { useCallback, useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { Recording } from "../types";

export function useAudioPlayer(
  recordings: Recording[],
  selectedId: number | null,
  onSelect: (id: number) => void,
) {
  const audio = useRef(new Audio()).current;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  const recordingsRef = useRef(recordings);
  const selectedIdRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    recordingsRef.current = recordings;
  }, [recordings]);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    function handleEnded() {
      const recs = recordingsRef.current;
      const idx = recs.findIndex((r) => r.id === selectedIdRef.current);
      const next = recs[idx + 1];
      if (next) onSelectRef.current(next.id);
      else setIsPlaying(false);
    }
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    const recording = recordingsRef.current.find((r) => r.id === selectedId);
    if (!recording) return;
    audio.src = convertFileSrc(recording.filePath);
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [selectedId]);

  const togglePlay = useCallback(() => {
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }, []);

  const playNext = useCallback(() => {
    const recs = recordingsRef.current;
    const idx = recs.findIndex((r) => r.id === selectedIdRef.current);
    const next = recs[idx + 1];
    if (next) onSelectRef.current(next.id);
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => {
      audio.loop = !prev;
      return !prev;
    });
  }, []);

  return {
    isPlaying,
    isLooping,
    togglePlay,
    stop,
    playNext,
    toggleLoop,
    audioEl: audio,
  };
}
