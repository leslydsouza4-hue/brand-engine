// Single-entry cache of the authenticated render MP4, so Download reuses prefetched bytes.
import { useCallback, useEffect, useState } from "react";
import { fetchJobMp4, isAbort, saveBlob, ShaunVideoError } from "./api";

export const MAX_PREPARED_BYTES = 300 * 1024 * 1024;

interface Entry { jobId: string; ac: AbortController; promise: Promise<Blob>; blob?: Blob }
let entry: Entry | null = null;

function drop() { if (entry) { entry.ac.abort(); entry = null; } }

/** Starts (or reuses) the one in-flight/prepared fetch for jobId. Replacing a job aborts the stale fetch. */
export function prepareRender(jobId: string): Promise<Blob> {
  if (entry?.jobId === jobId) return entry.promise;
  drop();
  const ac = new AbortController();
  const e: Entry = { jobId, ac, promise: Promise.resolve(new Blob()) };
  e.promise = fetchJobMp4(jobId, ac.signal, MAX_PREPARED_BYTES).then(
    blob => { e.blob = blob; return blob; },
    err => { if (entry === e) entry = null; throw err; },
  );
  entry = e;
  return e.promise;
}
/** The prefetched MP4 for jobId, if its bytes are already in memory. */
export function preparedBlob(jobId: string): Blob | undefined { return entry?.jobId === jobId ? entry.blob : undefined; }
export function clearPrepared(jobId?: string) { if (!jobId || entry?.jobId === jobId) drop(); }

export type PreparedStatus = "idle" | "preparing" | "ready" | "saving" | "error" | "deferred";

export function usePreparedDownload(jobId: string | null, filename: string) {
  const [state, setState] = useState<{ jobId: string | null; status: PreparedStatus; error?: string }>({ jobId: null, status: "idle" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!jobId) { clearPrepared(); setState({ jobId: null, status: "idle" }); return; }
    let live = true;
    setState({ jobId, status: entry?.jobId === jobId && entry.blob ? "ready" : "preparing" });
    prepareRender(jobId).then(
      () => { if (live) setState(s => s.jobId === jobId && s.status !== "saving" ? { jobId, status: "ready" } : s); },
      err => { if (live && !isAbort(err)) setState(err instanceof ShaunVideoError && err.status===413 ? {jobId,status:"deferred"} : { jobId, status: "error", error: (err as Error).message || "Could not prepare the download." }); },
    );
    return () => { live = false; };
  }, [jobId, attempt]);
  useEffect(() => () => clearPrepared(), []);

  const download = useCallback(async () => {
    if (!jobId) return;
    if (state.status === "error") { setAttempt(n => n + 1); return; }
    setState({ jobId, status: "saving" });
    try {
      // The preparation memory limit is not an export size limit. Large files
      // keep the existing on-demand authenticated download behavior.
      const blob = state.status==="deferred" ? await fetchJobMp4(jobId) : await prepareRender(jobId);
      saveBlob(blob, filename);
      setState({ jobId, status: state.status==="deferred"?"deferred":"ready" });
    } catch (err) {
      if (isAbort(err)) return;
      setState({ jobId, status: "error", error: (err as Error).message || "Download failed. Try again." });
    }
  }, [jobId, filename, state.status]);
  const retry = useCallback(() => setAttempt(n => n + 1), []);
  const st = state.jobId === jobId ? state : { jobId, status: (jobId ? "preparing" : "idle") as PreparedStatus };
  return { ...st, download, retry };
}
export { ShaunVideoError };
