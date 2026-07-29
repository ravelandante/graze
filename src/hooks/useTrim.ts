import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/plugins/regions";
import type { Region } from "wavesurfer.js/plugins/regions";
import type { Recording } from "@types";
import { useStore } from "@store";

export function useTrim(
  audioEl: HTMLAudioElement,
  recording: Recording | null,
  expanded: boolean,
  onTrim?: (start: number, end: number) => void,
) {
  const setTrimMarkers = useStore((s) => s.setTrimMarkers);

  const [trimIn, setTrimIn] = useState<number | null>(null);
  const [trimOut, setTrimOut] = useState<number | null>(null);

  const trimInRef = useRef<number | null>(null);
  const trimOutRef = useRef<number | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const regionRef = useRef<Region | null>(null);

  function persist() {
    if (!recording) return;
    const trimIn = trimInRef.current;
    const trimOut = trimOutRef.current;
    if (trimIn === null || trimOut === null) {
      void setTrimMarkers(recording.id, null, null);
    } else {
      void setTrimMarkers(
        recording.id,
        Math.min(trimIn, trimOut),
        Math.max(trimIn, trimOut),
      );
    }
  }

  useEffect(() => {
    const inPt = trimInRef.current;
    const outPt = trimOutRef.current;
    regionRef.current?.remove();
    regionRef.current = null;
    if (regionsRef.current && inPt !== null && outPt !== null) {
      regionRef.current = addRegion(regionsRef.current, inPt, outPt);
    }
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const inPt = recording?.trimStart ?? null;
    const outPt = recording?.trimEnd ?? null;
    trimInRef.current = inPt;
    trimOutRef.current = outPt;
    setTrimIn(inPt);
    setTrimOut(outPt);
    regionRef.current = null;
    regionsRef.current = null;
  }, [recording?.filePath]); // eslint-disable-line react-hooks/exhaustive-deps

  function attachRegionListeners(region: Region) {
    region.on("update-end", () => {
      trimInRef.current = region.start;
      trimOutRef.current = region.end;
      setTrimIn(region.start);
      setTrimOut(region.end);
      persist();
    });
  }

  function addRegion(
    regions: RegionsPlugin,
    inPt: number,
    outPt: number,
  ): Region {
    const region = regions.addRegion({
      start: Math.min(inPt, outPt),
      end: Math.max(inPt, outPt),
      color: "rgba(161, 161, 170, 0.18)",
      drag: expanded,
      resize: expanded,
    });
    attachRegionListeners(region);
    return region;
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
        regionRef.current = addRegion(regions, inPt, outPt);
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
    const inPt = trimInRef.current;
    const outPt = trimOutRef.current;
    if (inPt !== null && outPt !== null) {
      regionRef.current = addRegion(regions, inPt, outPt);
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
    persist();
  }

  function handleSetOut() {
    trimOutRef.current = audioEl.currentTime;
    setTrimOut(audioEl.currentTime);
    if (trimInRef.current === null) {
      trimInRef.current = 0;
      setTrimIn(0);
    }
    updateRegion();
    persist();
  }

  function handleTrimApply() {
    const inPt = trimInRef.current;
    const outPt = trimOutRef.current;
    if (inPt !== null && outPt !== null) {
      onTrim?.(Math.min(inPt, outPt), Math.max(inPt, outPt));
    }
  }

  function handleClear() {
    regionRef.current?.remove();
    regionRef.current = null;
    trimInRef.current = null;
    trimOutRef.current = null;
    setTrimIn(null);
    setTrimOut(null);
    persist();
  }

  return {
    trimIn,
    trimOut,
    canTrim: trimIn !== null && trimOut !== null,
    handleWsReady,
    handleSetIn,
    handleSetOut,
    handleTrimApply,
    handleClear,
  };
}
