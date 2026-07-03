import { useState } from "react";
import { formatTimeReference } from "../lib/format";
import { useStore } from "../store";

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <>
      <span className="text-xs text-zinc-500 py-1.5 pr-1 border-b border-zinc-800 whitespace-nowrap">
        {label}
      </span>
      <span
        className="text-xs text-zinc-200 py-1.5 pl-2 border-b border-zinc-800 min-w-0"
        style={{ wordBreak: "normal", overflowWrap: "normal" }}
      >
        {value ?? "—"}
      </span>
    </>
  );
}

export function RecordingDetail() {
  const recording = useStore(
    (s) => s.recordings.find((r) => r.id === s.selectedRecordingId) ?? null,
  );
  const saveRecording = useStore((s) => s.saveRecording);

  const [title, setTitle] = useState(recording?.title ?? "");
  const [comment, setComment] = useState(recording?.comment ?? "");
  const [dirty, setDirty] = useState(false);

  if (!recording) return null;

  function handleSave() {
    saveRecording({ title: title || null, comment: comment || null });
    setDirty(false);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
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
                onChange={(e) => {
                  setTitle(e.target.value);
                  setDirty(true);
                }}
                className="w-full bg-zinc-800 text-sm text-white px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Comment
              </label>
              <textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setDirty(true);
                }}
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
          <div
            className="grid w-full"
            style={{ gridTemplateColumns: "max-content 1fr" }}
          >
            <h3 className="col-span-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 pb-3">
              File info
            </h3>
            <MetaRow label="File" value={recording.fileName} />
            <MetaRow
              label="Format"
              value={recording.format?.toUpperCase() ?? null}
            />
            <MetaRow
              label="Sample rate"
              value={recording.sampleRate ? `${recording.sampleRate} Hz` : null}
            />
            <MetaRow
              label="Bit depth"
              value={recording.bitDepth ? `${recording.bitDepth}-bit` : null}
            />
            <MetaRow label="Channels" value={recording.channels} />

            <h3 className="col-span-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 pt-6 pb-3">
              BWF / Recorder
            </h3>
            <MetaRow label="Device" value={recording.originator} />
            <MetaRow
              label="TimeReference"
              value={formatTimeReference(
                recording.timeReference,
                recording.sampleRate,
                recording.recordedAt,
              )}
            />
            <MetaRow label="Description" value={recording.bwfDescription} />
          </div>
        </section>
      </div>
    </div>
  );
}
