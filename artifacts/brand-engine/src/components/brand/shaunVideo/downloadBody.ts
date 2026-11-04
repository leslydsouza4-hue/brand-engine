/** Read a download with real byte progress and a bounded wait for the next chunk. */
export async function readDownloadBody(response: Response, options: {
  signal?: AbortSignal;
  maxBytes?: number;
  onProgress?: (loaded: number, total?: number) => void;
  idleMs?: number;
} = {}): Promise<Blob> {
  const { signal, onProgress, maxBytes = 500 * 1048576, idleMs = 60_000 } = options;
  const length = Number(response.headers.get("content-length"));
  const total = Number.isFinite(length) && length > 0 ? length : undefined;
  const tooLarge = () => new Error(`This video exceeds ${Math.round(maxBytes / 1048576)} MB. Choose Fast 720p and try again.`);
  if (total && total > maxBytes) { await response.body?.cancel(); throw tooLarge(); }
  if (!response.body) throw new Error("The server returned no video data. Please retry Download MP4.");
  const reader = response.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let loaded = 0;
  try {
    for (;;) {
      signal?.throwIfAborted();
      const result = await new Promise<ReadableStreamReadResult<Uint8Array>>((resolve, reject) => {
        const cleanup = () => { clearTimeout(timer); signal?.removeEventListener("abort", abort); };
        const abort = () => { cleanup(); reject(new DOMException("Aborted", "AbortError")); };
        const timer = setTimeout(() => {
          cleanup();
          reject(new Error("The download stopped responding. Retry Download MP4; your finished video will be reused."));
        }, idleMs);
        signal?.addEventListener("abort", abort, { once: true });
        reader.read().then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
      });
      signal?.throwIfAborted();
      if (result.done) break;
      loaded += result.value.byteLength;
      if (loaded > maxBytes) throw tooLarge();
      chunks.push(new Uint8Array(result.value));
      onProgress?.(loaded, total);
    }
    if (!loaded || (total && loaded !== total))
      throw new Error("The MP4 transfer was incomplete. Retry Download MP4; your finished video will be reused.");
    return new Blob(chunks, { type: "video/mp4" });
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally { reader.releaseLock(); }
}
