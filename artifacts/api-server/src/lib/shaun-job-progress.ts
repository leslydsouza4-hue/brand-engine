/** FFmpeg emits N/A before its first encoded frame. Never persist NaN as JSON null. */
export function finiteProgress(previous: number, next: number): number {
  const before = Number.isFinite(previous) ? Math.max(0, Math.min(0.99, previous)) : 0;
  return Number.isFinite(next) ? Math.max(before, Math.max(0, Math.min(0.99, next))) : before;
}

export function ffmpegProgress(line: string, duration: number): number | undefined {
  if (!line.startsWith("out_time_us=") || !Number.isFinite(duration) || duration <= 0) return;
  const raw = line.slice("out_time_us=".length).trim();
  if (!raw) return;
  const micros = Number(raw);
  if (!Number.isFinite(micros)) return;
  return Math.max(0, Math.min(99, micros / 1_000_000 / duration * 100));
}

// Heartbeats are written every 30 seconds. Allow six missed writes, not 20 minutes.
export function jobHeartbeatExpired(updatedAt: string, now = Date.now()): boolean {
  const updated = Date.parse(updatedAt);
  return !Number.isFinite(updated) || now - updated > 3 * 60_000;
}
