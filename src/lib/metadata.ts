import { invoke } from "@tauri-apps/api/core";
import type { RecordingInsert } from "./db";

export async function extractMetadata(
  filePath: string,
): Promise<RecordingInsert> {
  return invoke("extract_metadata", { filePath });
}
