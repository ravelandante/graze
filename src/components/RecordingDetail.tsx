import { useState } from "react";
import type { Recording } from "../types";
import { Waveform } from "./Waveform";

interface Props {
  recording: Recording;
  onSave: (updates: Partial<Recording>) => void;
  onNormalize: () => void;
  onTrim: (start: number, end: number) => void;
}

function MetaRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-zinc-800 last:border-0">
      <span className="text-xs text-zinc-500 w-32 shrink-0">{label}</span>
      <span className="text-xs text-zinc-200 break-all">{value ?? "—"}</span>
    </div>
  );
}

function formatTimeReference(samples: number | null, sampleRate: number | null): string {
  if (samples == null || sampleRate == null) return "—";
  const totalSeconds = samples / sampleRate;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const frames = Math.floor((totalSeconds % 1) * 25);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
}

export function RecordingDetail({ recording, onSave, onNormalize, onTrim }: Props) {
  const [title, setTitle] = useState(recording.title ?? "");
  const [comment, setComment] = useState(recording.comment ?? "");
  const [trimStart, setTrimStart] = useState("0");
  const [trimEnd, setTrimEnd] = useState(recording.durationSeconds?.toFixed(1) ?? "0");
  const [dirty, setDirty] = useState(false);

  function handleSave() {
    onSave({ title: title || null, comment: comment || null });
    setDirty(false);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 pt-5 pb-3 border-b border-zinc-800">
        <Waveform key={recording.filePath} filePath={recording.filePath} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            Tags
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
                className="w-full bg-zinc-800 text-sm text-white px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => { setComment(e.target.value); setDirty(true); }}
                rows={4}
                className="w-full bg-zinc-800 text-sm text-white px-3 py-2 rounded resize-none focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
          </div>
          {dirty && (
            <button
              onClick={handleSave}
              className="mt-3 bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-4 py-2 rounded"
            >
              Save changes
            </button>
          )}
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            File info
          </h3>
          <MetaRow label="File" value={recording.fileName} />
          <MetaRow label="Format" value={recording.format?.toUpperCase() ?? null} />
          <MetaRow label="Sample rate" value={recording.sampleRate ? `${recording.sampleRate} Hz` : null} />
          <MetaRow label="Bit depth" value={recording.bitDepth ? `${recording.bitDepth}-bit` : null} />
          <MetaRow label="Channels" value={recording.channels} />
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            BWF / Recorder
          </h3>
          <MetaRow label="Device" value={recording.originator} />
          <MetaRow label="TimeReference" value={formatTimeReference(recording.timeReference, recording.sampleRate)} />
          <MetaRow label="Description" value={recording.bwfDescription} />
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            Operations
          </h3>
          <p className="text-xs text-zinc-500 mb-3">
            Operations write a new file alongside the original — the original is never modified.
          </p>
          <div className="space-y-3">
            <button
              onClick={onNormalize}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-sm text-white px-4 py-2 rounded text-left"
            >
              Normalize (EBU R128 −23 LUFS)
            </button>
            <div className="bg-zinc-800 rounded p-3 space-y-2">
              <p className="text-xs text-zinc-400">Trim</p>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={trimStart}
                  onChange={(e) => setTrimStart(e.target.value)}
                  min="0"
                  step="0.1"
                  className="w-24 bg-zinc-700 text-sm text-white px-2 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
                <span className="text-zinc-500 text-xs">to</span>
                <input
                  type="number"
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(e.target.value)}
                  min="0"
                  step="0.1"
                  className="w-24 bg-zinc-700 text-sm text-white px-2 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
                <span className="text-zinc-500 text-xs">s</span>
                <button
                  onClick={() => onTrim(Number(trimStart), Number(trimEnd))}
                  className="ml-auto bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-3 py-1.5 rounded"
                >
                  Trim
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
