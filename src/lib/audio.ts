import { Command } from "@tauri-apps/plugin-shell";

// Expects ffmpeg to be on PATH. In production we'd bundle it as a sidecar.
async function ffmpeg(args: string[]): Promise<void> {
  const output = await Command.create("ffmpeg", args).execute();
  if (output.code !== 0) {
    throw new Error(`ffmpeg exited ${output.code}: ${output.stderr}`);
  }
}

export async function normalizeFile(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const pass1 = await Command.create("ffmpeg", [
    "-i", inputPath,
    "-af", "loudnorm=I=-23:TP=-2:LRA=7:print_format=json",
    "-f", "null", "-",
  ]).execute();

  const statsMatch = pass1.stderr.match(/\{[\s\S]*"output_i"[\s\S]*?\}/);
  if (!statsMatch) {
    await ffmpeg([
      "-i", inputPath,
      "-af", "loudnorm=I=-23:TP=-2:LRA=7",
      "-ar", "48000",
      outputPath,
    ]);
    return;
  }

  const stats = JSON.parse(statsMatch[0]) as Record<string, string>;
  await ffmpeg([
    "-i", inputPath,
    "-af", [
      "loudnorm=I=-23:TP=-2:LRA=7",
      `measured_I=${stats.input_i}`,
      `measured_TP=${stats.input_tp}`,
      `measured_LRA=${stats.input_lra}`,
      `measured_thresh=${stats.input_thresh}`,
      "linear=true",
    ].join(":"),
    outputPath,
  ]);
}

export async function trimFile(
  inputPath: string,
  outputPath: string,
  startSeconds: number,
  endSeconds: number
): Promise<void> {
  const duration = endSeconds - startSeconds;
  await ffmpeg([
    "-i", inputPath,
    "-ss", String(startSeconds),
    "-t", String(duration),
    "-c", "copy",
    outputPath,
  ]);
}
