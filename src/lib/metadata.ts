import { invoke } from "@tauri-apps/api/core";
import type { Recording } from "../types";

export async function extractMetadata(
  filePath: string,
): Promise<Omit<Recording, "id" | "importedAt">> {
  return invoke("extract_metadata", { filePath });
}
