import { useEffect, useState } from "react";

export function useAudioTime(audioEl: HTMLAudioElement): number {
  const [time, setTime] = useState(() => audioEl.currentTime);

  useEffect(() => {
    const update = () => setTime(audioEl.currentTime);
    update();
    audioEl.addEventListener("timeupdate", update);
    // `emptied` resets the display to 0 when the source changes.
    audioEl.addEventListener("emptied", update);
    return () => {
      audioEl.removeEventListener("timeupdate", update);
      audioEl.removeEventListener("emptied", update);
    };
  }, [audioEl]);

  return time;
}
