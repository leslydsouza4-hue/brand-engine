import { sessionRequest, teamPath } from "./sessionClient";

export const assetUrl = (team: string, id: string) => `${teamPath(team)}/assets/${encodeURIComponent(id)}`;
const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/avif"]);

export async function uploadSessionAsset(team: string, blob: Blob, name = "session-image"): Promise<string> {
  if (!allowedTypes.has(blob.type)) throw new Error(`Unsupported session image type: ${blob.type || "unknown"}`);
  if (!blob.size || blob.size > 25 * 1024 * 1024) throw new Error("Session images must be between 1 byte and 25 MB");
  const { assetId, uploadURL } = await sessionRequest<{ assetId: string; uploadURL: string }>(
    `${teamPath(team)}/assets`, "POST", { name, contentType: blob.type, size: blob.size },
  );
  const response = await fetch(uploadURL, { method: "PUT", credentials: "omit", headers: { "Content-Type": blob.type }, body: blob });
  if (!response.ok) throw new Error(`Image upload failed (${response.status})`);
  await sessionRequest(`${teamPath(team)}/assets/${encodeURIComponent(assetId)}/complete`, "POST");
  return assetId;
}

export function privateAssetId(value: string, team: string): string | null {
  const origin = typeof location === "undefined" ? "http://localhost" : location.origin;
  let url: URL;
  try { url = new URL(value, origin); } catch { return null; }
  if (url.origin !== origin) return null;
  const match = url.pathname.match(/^\/api\/session-teams\/([^/]+)\/assets\/([^/]+)$/);
  if (!match) return null;
  if (decodeURIComponent(match[1]) !== team) throw new Error("Cannot save assets belonging to another team");
  return decodeURIComponent(match[2]);
}

/** Recursively preserves JSON values, rejecting anything JSON would silently lose. */
export function cloneSessionState<T>(value: T): T {
  const seen = new Set<object>();
  function visit(item: unknown): unknown {
    if (item === null || typeof item === "string" || typeof item === "boolean") return item;
    if (typeof item === "number" && Number.isFinite(item)) return item;
    if (typeof item !== "object" || !item) throw new Error("Session state must contain JSON values only");
    if (seen.has(item)) throw new Error("Session state cannot contain circular references");
    if (!Array.isArray(item) && Object.getPrototypeOf(item) !== Object.prototype && Object.getPrototypeOf(item) !== null) {
      throw new Error("Session state must use plain records/arrays; serialize Sets and Dates explicitly");
    }
    seen.add(item);
    const result = Array.isArray(item) ? item.map(visit) : Object.fromEntries(Object.entries(item).map(([key, entry]) => [key, visit(entry)]));
    seen.delete(item);
    return result;
  }
  return visit(value) as T;
}

export async function persistSessionAssets(state: Record<string, unknown>, team: string): Promise<Record<string, unknown>> {
  const cache = new Map<string, Promise<string>>();
  async function visit(value: unknown): Promise<unknown> {
    if (typeof value === "string") {
      const existing = privateAssetId(value, team);
      if (existing) return { __brandAsset: existing };
      if (/^(data|blob):/i.test(value)) {
        let pending = cache.get(value);
        if (!pending) {
          pending = (async () => {
            const response = await fetch(value);
            if (!response.ok) throw new Error("Could not read local session image");
            return uploadSessionAsset(team, await response.blob());
          })();
          cache.set(value, pending);
        }
        return { __brandAsset: await pending };
      }
      if (/(?:url\(\s*["']?|["'\s])(?:data:|blob:)/i.test(value)) throw new Error("Embedded data/blob URLs must be stored as standalone image fields");
      return value;
    }
    if (Array.isArray(value)) return Promise.all(value.map(visit));
    if (value && typeof value === "object") return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key, entry]) => [key, await visit(entry)])));
    return value;
  }
  return await visit(cloneSessionState(state)) as Record<string, unknown>;
}

export function resolveSessionAssets(state: Record<string, unknown>, team: string): Record<string, unknown> {
  function visit(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(visit);
    if (value && typeof value === "object") {
      if ("__brandAsset" in value) {
        if (typeof value.__brandAsset !== "string" || Object.keys(value).length !== 1) throw new Error("Invalid session asset reference");
        return assetUrl(team, value.__brandAsset);
      }
      return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, visit(entry)]));
    }
    return value;
  }
  return visit(state) as Record<string, unknown>;
}

export async function captureSessionThumbnail(element: HTMLElement): Promise<Blob> {
  const [{ toPng }, { getFontEmbedCSS }] = await Promise.all([import("html-to-image"), import("../fontEmbed")]);
  await document.fonts.ready;
  await Promise.all(Array.from(element.querySelectorAll("img")).map(async image => {
    if (image.src) await image.decode();
  }));
  const fontEmbedCSS = await getFontEmbedCSS();
  await new Promise(resolve => setTimeout(resolve, 30));
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) throw new Error("Preview is not visible");
  const options = { fontEmbedCSS, width: rect.width, height: rect.height, pixelRatio: Math.min(1, 480 / Math.max(rect.width, rect.height)), skipAutoScale: true };
  // A warm pass lets html-to-image decode its embedded images before final capture.
  await toPng(element, options);
  const dataUrl = await toPng(element, options);
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 480 / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Thumbnail canvas is unavailable");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Thumbnail encoding failed")), "image/png"));
}