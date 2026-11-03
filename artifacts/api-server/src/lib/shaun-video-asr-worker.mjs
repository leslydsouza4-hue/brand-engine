import { pipeline, env } from "@huggingface/transformers";
import { readFile } from "node:fs/promises";
import { appendAlignedWord } from "./shaun-caption-alignment.mjs";

// Generated model files stay outside the repository. Hugging Face model card:
// https://huggingface.co/Xenova/whisper-tiny.en (Apache-2.0 ONNX conversion).
env.cacheDir = "/tmp/shaun-whisper-models";
env.allowLocalModels = false;
let recognizer;
let busy = false;
let idle;
let lastDownloadProgress = 0;
const send = value => { if (process.connected) process.send(value); };
function scheduleExit() {
  clearTimeout(idle);
  idle = setTimeout(() => process.exit(0), 5 * 60 * 1000);
}
function pcm16(bytes) {
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WAVE")
    throw new Error("Expected a PCM WAV audio file");
  let audio, validFormat = false;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const name = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    if (offset + 8 + size > bytes.length) throw new Error("Truncated WAV file");
    if (name === "fmt " && size >= 16) {
      validFormat = bytes.readUInt16LE(offset + 8) === 1 && bytes.readUInt16LE(offset + 10) === 1 &&
        bytes.readUInt32LE(offset + 12) === 16000 && bytes.readUInt16LE(offset + 22) === 16;
    }
    if (name === "data") audio = bytes.subarray(offset + 8, offset + 8 + size);
    offset += 8 + size + size % 2;
  }
  if (!validFormat || !audio || audio.length % 2 || audio.length > 16000 * 2 * 600)
    throw new Error("Expected mono 16kHz PCM16 audio, at most 10 minutes");
  return Float32Array.from({ length: audio.length / 2 }, (_, i) => audio.readInt16LE(i * 2) / 32768);
}
process.on("message", async message => {
  if (message?.type !== "transcribe" || busy) return;
  busy = true; clearTimeout(idle);
  try {
    if (!recognizer) {
      send({ type: "progress", value: 0, phase: "Loading local Whisper model (first use downloads public model files)" });
      recognizer = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en", {
        device: "cpu", dtype: "q8",
        session_options: { intraOpNumThreads: 2, interOpNumThreads: 1 },
        progress_callback: event => {
          if (event.status === "progress" && Date.now() - lastDownloadProgress > 250) {
            lastDownloadProgress = Date.now();
            send({ type: "progress", value: Math.min(0.15, (event.progress || 0) / 100 * 0.15), phase: `Downloading Whisper model: ${event.file || "model"} (${Math.round(event.progress || 0)}%)` });
          }
        },
      });
    }
    const audio = pcm16(await readFile(message.path));
    const duration = audio.length / 16000;
    const words = [];
    let groupedUncertainWords = 0;
    let pendingText = "";
    // Overlapping context windows; keep words by their model-aligned midpoint.
    // Every retained start/end comes from Whisper cross-attention DTW, never
    // from a word count, text length, or uniformly distributed time interval.
    for (let centerStart = 0; centerStart < duration; centerStart += 20) {
      const centerEnd = Math.min(duration, centerStart + 20);
      const windowStart = Math.max(0, centerStart - 3);
      const windowEnd = Math.min(duration, centerEnd + 3);
      send({ type: "progress", value: 0.15 + centerStart / duration * 0.83, phase: `Transcribing speech: ${Math.round(centerStart)} / ${Math.ceil(duration)} seconds` });
      const output = await recognizer(audio.subarray(Math.round(windowStart * 16000), Math.round(windowEnd * 16000)), {
        return_timestamps: "word", chunk_length_s: 30, stride_length_s: 3,
      });
      for (const chunk of output.chunks || []) {
        const text = chunk.text.trim();
        const [relativeStart, relativeEnd] = chunk.timestamp;
        if (!text) continue;
        const start = Number.isFinite(relativeStart) ? Math.round((windowStart + relativeStart) * 100) / 100 : NaN;
        const end = Number.isFinite(relativeEnd) ? Math.round((windowStart + relativeEnd) * 100) / 100 : NaN;
        const midpoint = (start + end) / 2;
        if (midpoint < centerStart || midpoint >= centerEnd && centerEnd < duration) continue;
        const grouped = appendAlignedWord(words, `${pendingText} ${text}`.trim(), start, end, duration);
        if (grouped === null) { pendingText = `${pendingText} ${text}`.trim(); groupedUncertainWords++; }
        else { pendingText = ""; if (grouped) groupedUncertainWords++; }
      }
    }
    if (!words.length) throw new Error("No timestamped English speech was detected. Check the audio track and try again.");
    send({ type: "result", result: {
      text: words.map(w => w.text).join(" "), words, segments: [], timing: "word",
      timestampMethod: "whisper-cross-attention-dtw", model: "Xenova/whisper-tiny.en",
      language: "en", duration, omittedUncertainWords: 0, groupedUncertainWords,
    } });
  } catch (error) {
    send({ type: "error", error: error instanceof Error ? error.message : "Local Whisper transcription failed" });
  } finally { busy = false; scheduleExit(); }
});
process.on("disconnect", () => process.exit(0));
scheduleExit();
