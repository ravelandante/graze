import { useCallback, useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { Recording } from "../types";
import { loadSetting, saveSetting } from "../lib/settings";
import { useStore } from "../store";

export function useAudioPlayer(recordings: Recording[]) {
  const selectedId = useStore((s) => s.selectedRecordingId);
  const setSelectedId = useStore((s) => s.setSelectedRecordingId);

  const audio = useRef(new Audio()).current;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(() =>
    loadSetting("isLooping", false),
  );
  const [isAutoAdvance, setIsAutoAdvance] = useState(() =>
    loadSetting("isAutoAdvance", false),
  );
  const [isAutoplay, setIsAutoplay] = useState(() =>
    loadSetting("isAutoplay", true),
  );
  const [currentTime, setCurrentTime] = useState(0);

  const recordingsRef = useRef(recordings);
  const isAutoAdvanceRef = useRef(isAutoAdvance);
  const isAutoplayRef = useRef(isAutoplay);
  const selectedIdRef = useRef(selectedId);
  const setSelectedIdRef = useRef(setSelectedId);
  recordingsRef.current = recordings;
  selectedIdRef.current = selectedId;
  setSelectedIdRef.current = setSelectedId;

  useEffect(() => {
    audio.loop = isLooping;

    function handleEnded() {
      if (!isAutoAdvanceRef.current) {
        setIsPlaying(false);
        return;
      }
      const recs = recordingsRef.current;
      const idx = recs.findIndex((r) => r.id === selectedIdRef.current);
      const next = recs[idx + 1];
      if (next) setSelectedIdRef.current(next.id);
      else setIsPlaying(false);
    }
    function handleTimeUpdate() {
      setCurrentTime(audio.currentTime);
    }
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.pause();
      audio.src = "";
    };
  }, [audio]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedId) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    const recording = recordingsRef.current.find((r) => r.id === selectedId);
    if (!recording) return;
    audio.src = convertFileSrc(recording.filePath);
    if (isAutoplayRef.current) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      setIsPlaying(false);
    }
  }, [audio, selectedId]);

  const togglePlay = useCallback(() => {
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [audio]);

  const stop = useCallback(() => {
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }, [audio]);

  const playNext = useCallback(() => {
    const recs = recordingsRef.current;
    const idx = recs.findIndex((r) => r.id === selectedIdRef.current);
    const next = recs[idx + 1];
    if (next) setSelectedIdRef.current(next.id);
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => {
      const next = !prev;
      audio.loop = next;
      saveSetting("isLooping", next);
      return next;
    });
  }, [audio]);

  const toggleAutoAdvance = useCallback(() => {
    setIsAutoAdvance((prev) => {
      const next = !prev;
      isAutoAdvanceRef.current = next;
      saveSetting("isAutoAdvance", next);
      return next;
    });
  }, []);

  const toggleAutoplay = useCallback(() => {
    setIsAutoplay((prev) => {
      const next = !prev;
      isAutoplayRef.current = next;
      saveSetting("isAutoplay", next);
      return next;
    });
  }, []);

  return {
    isPlaying,
    isLooping,
    isAutoAdvance,
    isAutoplay,
    currentTime,
    togglePlay,
    stop,
    playNext,
    toggleLoop,
    toggleAutoAdvance,
    toggleAutoplay,
    audioEl: audio,
  };
}
