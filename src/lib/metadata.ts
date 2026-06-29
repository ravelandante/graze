import { readFile } from "@tauri-apps/plugin-fs";
import { parseBuffer } from "music-metadata";
import type { IFormat } from "music-metadata";
import type { Recording } from "../types";

export async function extractMetadata(
  filePath: string,
): Promise<Omit<Recording, "id" | "importedAt" | "notes">> {
  const bytes = await readFile(filePath);

  const meta = await parseBuffer(bytes, undefined, { skipCovers: true });

  const { common, format, native } = meta;

  const bext = native?.["riff"]?.find((t) => t.id === "bext");

  const originator = common.encodedby ?? null;

  // timeReference is typed on IFormat but TS doesn't expose it directly
  const timeReference: number | null =
    (format as IFormat & { timeReference?: number }).timeReference ?? null;

  const fileName = filePath.split("/").pop() ?? filePath;

  const rawComment = common.comment?.[0];
  const comment =
    rawComment == null
      ? null
      : typeof rawComment === "string"
        ? rawComment
        : (rawComment as { text?: string }).text ?? null;

  return {
    filePath,
    fileName,
    title: common.title ?? null,
    artist: common.artist ?? null,
    comment,
    originator,
    originatorReference: null,
    timeReference,
    bwfDescription: bext ? String(bext.value) : null,
    recordedAt: null,
    durationSeconds: format.duration ?? null,
    sampleRate: format.sampleRate ?? null,
    bitDepth: format.bitsPerSample ?? null,
    channels: format.numberOfChannels ?? null,
    format: filePath.toLowerCase().endsWith(".mp3") ? "mp3" : "wav",
    fileSizeBytes: null,
  };
}
