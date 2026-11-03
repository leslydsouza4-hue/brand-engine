import { createHash } from "node:crypto";
import { chmod, copyFile, link, mkdir, readdir, rename, rm, stat, utimes } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

/** Private, disposable cache of immutable originals. Never serve this directory.
 * Callers must authorize the video first. Job-local hard links keep active inputs
 * alive during eviction; the existing two-job limit bounds those extra bytes.
 * One API process owns this directory (as with the in-process worker limiter).
 */
export class VideoSourceCache {
  private pending: Promise<unknown> = Promise.resolve();
  constructor(
    private directory = join(tmpdir(), "brand-engine-video-sources"),
    private maxFileBytes = 250 * 1024 * 1024,
    private maxBytes = 1024 * 1024 * 1024,
    private ttlMs = 15 * 60_000,
  ) {}

  private serial<T>(work: () => Promise<T>): Promise<T> {
    const result = this.pending.then(work);
    this.pending = result.catch(() => undefined);
    return result;
  }

  private async prune(reserve = 0) {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    await chmod(this.directory, 0o700);
    const entries = await Promise.all((await readdir(this.directory)).map(async name => {
      const path = join(this.directory, name);
      return { path, name, ...await stat(path) };
    }));
    let bytes = entries.reduce((sum, entry) => sum + entry.size, 0);
    for (const entry of entries.sort((a, b) => a.mtimeMs - b.mtimeMs)) {
      if (entry.name.endsWith(".part") || Date.now() - entry.mtimeMs > this.ttlMs || bytes + reserve > this.maxBytes) {
        await rm(entry.path, { force: true });
        bytes -= entry.size;
      }
    }
  }

  sweep() { return this.serial(() => this.prune()); }

  /** Load is single-flight, including concurrent preview/layout consumers.
   * Publication is atomic; failed or oversized downloads never become hits.
   */
  materialize(key: string, destination: string, load: (path: string) => Promise<void>) {
    return this.serial(async () => {
      await this.prune();
      const path = join(this.directory, createHash("sha256").update(key).digest("hex"));
      const hit = await stat(path).then(() => true, error => {
        if (error.code === "ENOENT") return false;
        throw error;
      });
      if (!hit) {
        await this.prune(this.maxFileBytes);
        const partial = `${path}.part`;
        try {
          await load(partial);
          if ((await stat(partial)).size > this.maxFileBytes) throw new Error("Source exceeds cache file limit");
          await chmod(partial, 0o600);
          await rename(partial, path);
        } finally { await rm(partial, { force: true }); }
      }
      const now = new Date();
      await utimes(path, now, now);
      await this.link(path, destination);
      return hit;
    });
  }

  private async link(source: string, destination: string) {
    try { await link(source, destination); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EXDEV") throw error;
      await copyFile(source, destination, 1);
    }
  }

  /** Seed from an already validated local original, without a network transfer. */
  async seed(key: string, source: string) {
    // materialize requires a separate destination; remove the temporary lease.
    const lease = `${source}.cache-lease`;
    try { await this.materialize(key, lease, path => this.link(source, path)); }
    finally { await rm(lease, { force: true }); }
  }
}

export const videoSourceCache = new VideoSourceCache();
const sweep = setInterval(() => {
  void videoSourceCache.sweep().catch(error => console.warn("Video source cache cleanup failed", error.code));
}, 60_000);
sweep.unref();
