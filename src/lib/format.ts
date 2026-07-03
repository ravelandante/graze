export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatTimeReference(
  samples: number | null,
  sampleRate: number | null,
  recordedAt?: string | null,
): string {
  if (samples == null || sampleRate == null) return "—";
  const t = samples / sampleRate;
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  if (!recordedAt) return time;
  const datePart = recordedAt.split("T")[0]; // "YYYY-MM-DD"
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return time;
  return `${time} - ${year}/${month}/${day}`;
}
