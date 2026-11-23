import { readFile } from "node:fs/promises";
import type { TranscriptResult } from "./shaun-video-transcribe";

/** Cloud speech (Deepgram Nova-3): word timestamps for a minute of audio in ~2 s on
 * any server size. Enabled only when DEEPGRAM_API_KEY is set; callers fall back to
 * local Whisper on any failure. The key is read from the environment, never stored. */
export function deepgramConfigured() { return !!process.env.DEEPGRAM_API_KEY?.trim(); }

type DeepgramWord = { word?: string; punctuated_word?: string; start?: number; end?: number };
export function deepgramWords(words: DeepgramWord[], duration: number): TranscriptResult["words"] {
  const out: TranscriptResult["words"] = [];
  for (const w of words) {
    const text = (w.punctuated_word ?? w.word ?? "").trim().slice(0, 500);
    if (!text || !Number.isFinite(w.start) || !Number.isFinite(w.end)) continue;
    // Render requires chronological, non-overlapping words inside the video.
    const prevEnd = out.at(-1)?.end ?? 0;
    const start = Math.min(duration, Math.max(prevEnd, Math.round(w.start! * 1000) / 1000));
    const end = Math.min(duration, Math.max(start + 0.02, Math.round(w.end! * 1000) / 1000));
    if (end <= start) continue;
    out.push({ text, start, end });
  }
  return out;
}

export async function transcribeDeepgram(wavPath: string, duration: number, signal?: AbortSignal): Promise<TranscriptResult> {
  const key = process.env.DEEPGRAM_API_KEY?.trim();
  if (!key) throw new Error("Deepgram is not configured");
  const audio = await readFile(wavPath);
  const params = new URLSearchParams({ model: "nova-3", language: "en", smart_format: "true", punctuate: "true" });
  // Brand/name hints (Nova-3 keyterm prompting): "Shaun" was heard as "Sharp".
  for (const term of ["Shaun", "Shaun Clark", "HighLevel", "GoHighLevel", "LeadConnector"]) params.append("keyterm", term);
  const timeout = AbortSignal.timeout(90_000);
  const res = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: "POST", headers: { Authorization: `Token ${key}`, "Content-Type": "audio/wav" }, body: audio,
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (!res.ok) throw Object.assign(new Error(`Deepgram request failed (${res.status})`), { code: "DEEPGRAM_FAILED", status: res.status });
  const body = await res.json() as { results?: { channels?: Array<{ alternatives?: Array<{ words?: DeepgramWord[] }> }> } };
  const words = deepgramWords(body.results?.channels?.[0]?.alternatives?.[0]?.words ?? [], duration);
  if (!words.length) throw Object.assign(new Error("No timestamped English speech was detected"), { code: "DEEPGRAM_EMPTY" });
  return { text: words.map(w => w.text).join(" "), words, segments: [], timing: "word", timestampMethod: "deepgram-nova-3",
    model: "deepgram/nova-3", language: "en", duration, omittedUncertainWords: 0 };
}
