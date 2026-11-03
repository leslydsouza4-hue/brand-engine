import { fork, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SessionError } from "./session-validation";

export type TranscriptResult = {
  text: string; words: Array<{ text: string; start: number; end: number }>;
  segments: []; timing: "word"; timestampMethod: "whisper-cross-attention-dtw";
  model: string; language: "en"; duration: number; omittedUncertainWords: number;
};
let child: ChildProcess | undefined;
let busy = false;
export function isTranscriptionBusy() { return busy; }
export function disposeLocalTranscriber() {
  if (busy) throw new Error("Cannot dispose a busy transcription worker");
  child?.kill("SIGKILL"); child = undefined;
}

/** One reusable CPU model process, killed on deadline/abort and idled out after
 * five minutes. A separate process makes the timeout enforceable during ONNX
 * execution and isolates model memory from the HTTP server. */
export async function transcribeLocalAudio(path: string, progress: (value: number, phase: string) => void, signal?: AbortSignal): Promise<TranscriptResult> {
  if (busy) throw new SessionError(429, "A speech transcription is already running. Please wait.", "TRANSCRIPTION_BUSY");
  if (signal?.aborted) throw new SessionError(409, "Speech transcription was cancelled");
  busy = true;
  return new Promise((resolve, reject) => {
    if (!child?.connected) {
      child = fork(fileURLToPath(new URL("./shaun-video-asr-worker.mjs", import.meta.url)), [], {
        stdio: ["ignore", "ignore", "ignore", "ipc"], execArgv: [],
      });
    }
    const process = child;
    let settled = false;
    const finish = (error?: Error, result?: TranscriptResult) => {
      if (settled) return;
      settled = true; clearTimeout(timer); busy = false;
      process.off("message", onMessage); process.off("error", onError); process.off("exit", onExit);
      signal?.removeEventListener("abort", onAbort);
      if (error) {
        process.kill("SIGKILL"); if (child === process) child = undefined;
        reject(error);
      } else resolve(result!);
    };
    const onMessage = (message: unknown) => {
      const event = message as { type?: string; value?: number; phase?: string; error?: string; result?: TranscriptResult };
      if (event.type === "progress") progress(event.value || 0, event.phase || "Transcribing speech");
      else if (event.type === "result") finish(undefined, event.result);
      else if (event.type === "error") finish(new SessionError(422,
        event.error?.startsWith("No timestamped English speech") ? event.error :
          "Local Whisper could not transcribe this audio. Check network access for the first model download and retry.", "TRANSCRIPTION_FAILED"));
    };
    const onError = () => finish(new SessionError(503, "Local speech worker could not start. Please retry.", "TRANSCRIPTION_FAILED"));
    const onExit = () => finish(new SessionError(503, "Local speech worker stopped before completing. Please retry.", "TRANSCRIPTION_FAILED"));
    const onAbort = () => finish(new SessionError(409, "Speech transcription was cancelled", "TRANSCRIPTION_CANCELLED"));
    const timer = setTimeout(() => finish(new SessionError(504, "Speech transcription exceeded its 12 minute limit. Try a shorter video.", "TRANSCRIPTION_TIMEOUT")), 12 * 60 * 1000);
    process.on("message", onMessage); process.once("error", onError); process.once("exit", onExit);
    signal?.addEventListener("abort", onAbort, { once: true });
    process.send({ type: "transcribe", path }, error => { if (error) onError(); });
  });
}
