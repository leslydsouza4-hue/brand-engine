import https from "node:https";
import { lookup } from "node:dns/promises";
import { isIP, BlockList } from "node:net";
import { createWriteStream } from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { SessionError } from "./session-validation";
import { MAX_VIDEO_BYTES } from "./shaun-video-store";

const denied = new BlockList();
for (const [address, prefix] of [["0.0.0.0",8],["10.0.0.0",8],["127.0.0.0",8],["169.254.0.0",16],["172.16.0.0",12],["192.168.0.0",16],["100.64.0.0",10],["192.0.0.0",24],["198.18.0.0",15],["224.0.0.0",4],["240.0.0.0",4]] as const)
  denied.addSubnet(address, prefix, "ipv4");
function validUrl(raw: string, page = false) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new SessionError(400, "Invalid Descript URL"); }
  const host = url.hostname.toLowerCase();
  const publishedDownload = host === "api.descript.com" &&
    /^\/v2\/published_projects\/[0-9a-f-]{36}\/download$/.test(url.pathname);
  // Observed public Descript original-download redirect target, restricted to
  // its exact media-cache bucket/remux object format, not arbitrary GCS URLs.
  const publicRemux = host === "storage.googleapis.com" &&
    /^\/production-273614-media-cache\/v1\/remux\/[a-f0-9]{64}\.mp4$/.test(url.pathname);
  const allowed = page ? host === "share.descript.com" :
    ["share.descript.com", "media.descript.com", "cdn.descript.com", "descriptusercontent.com"].includes(host) ||
    host.endsWith(".descriptusercontent.com") || publishedDownload || publicRemux;
  if (url.protocol !== "https:" || url.port && url.port !== "443" || url.username || url.password || isIP(host) || !allowed)
    throw new SessionError(400, "Only public Descript share URLs and Descript media hosts are allowed");
  if (page && !/^\/view\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname))
    throw new SessionError(400, "Use a https://share.descript.com/view/... share link");
  return url;
}
export function validateDescriptShareUrl(raw: string) { return validUrl(raw, true).toString(); }
async function request(raw: string, redirects = 0): Promise<import("node:http").IncomingMessage> {
  if (redirects > 4) throw new SessionError(400, "Too many Descript redirects");
  const url = validUrl(raw);
  // Resolve ourselves, reject non-public addresses, then pin the connection to
  // that address. Never allow the HTTP client to re-resolve (DNS rebinding).
  let dnsTimer: ReturnType<typeof setTimeout> | undefined;
  const addresses = await Promise.race([
    lookup(url.hostname, { all: true, family: 4 }),
    new Promise<never>((_resolve, reject) => {
      dnsTimer = setTimeout(() => reject(new SessionError(422, "Descript host lookup timed out. Please upload an MP4 instead.")), 10000);
    }),
  ]).finally(() => clearTimeout(dnsTimer));
  if (!addresses.length || addresses.some(a => denied.check(a.address, "ipv4")))
    throw new SessionError(400, "Descript host did not resolve to a public address");
  const response = await new Promise<import("node:http").IncomingMessage>((resolve, reject) => {
    const req = https.get(url, {
      lookup: (_host, options, callback) => {
        // Node 20+ may request all addresses for autoSelectFamily. Preserve the
        // lookup callback shape while still returning only our pinned address.
        if (options.all) callback(null, [addresses[0]]);
        else callback(null, addresses[0].address, 4);
      },
      headers: { "User-Agent": "BrandEngine-VideoImport/1.0", "Accept-Encoding": "identity" },
    }, resolve);
    const timer = setTimeout(() => req.destroy(new Error("Descript request timed out")), 60000);
    req.on("close", () => clearTimeout(timer));
    req.on("error", reject);
  });
  if ([301,302,303,307,308].includes(response.statusCode || 0)) {
    const location = response.headers.location;
    response.destroy();
    if (!location) throw new SessionError(400, "Descript redirect has no destination");
    return request(new URL(location, url).toString(), redirects + 1);
  }
  if (response.statusCode !== 200) { response.destroy(); throw new SessionError(422, "Descript media is not publicly accessible. Export MP4 from Descript and upload it."); }
  return response;
}
const fallback = "No accessible MP4 was found in this Descript share. Export MP4 from Descript, then upload the file.";
/** Public share HTML embeds an application/json metadata object containing its
 * signed, download-enabled original URL. Use that supplied URL verbatim: do not
 * construct internal endpoints, signatures, or bypass disabled downloads. */
export function findDescriptMedia(html: string): string {
  for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\bid\s*=\s*["']metadata["']/i.test(script[1]) || !/\btype\s*=\s*["']application\/json["']/i.test(script[1])) continue;
    let metadata: { id?: string; downloads_enabled?: boolean; drive_downloads_enabled?: boolean; contents?: { media?: { original?: { url?: string; cdn_url?: string } } } };
    try { metadata = JSON.parse(script[2].replace(/&amp;/g, "&")); } catch { throw new SessionError(422, fallback); }
    if (metadata.downloads_enabled !== true || metadata.drive_downloads_enabled === false)
      throw new SessionError(422, "Downloads are disabled for this Descript share. Ask its owner to enable downloads, or export MP4 and upload it.");
    const original = metadata.contents?.media?.original;
    for (const candidate of [original?.url, original?.cdn_url]) {
      if (typeof candidate !== "string") continue;
      try {
        const url = validUrl(candidate);
        // Only the exact public project download URL embedded by Descript is
        // accepted on the API host. All redirects undergo the same DNS checks.
        if (url.hostname === "api.descript.com" && url.pathname !== `/v2/published_projects/${metadata.id}/download`) continue;
        return url.toString();
      } catch { /* Try the public CDN alternative, if provided. */ }
    }
  }
  const decoded = html.replace(/\\u002[fF]/g, "/").replace(/\\\//g, "/").replace(/&amp;/g, "&").replace(/\\u0026/g, "&");
  const candidates: string[] = decoded.match(/https:\/\/[^\s"'<>\\]+\.mp4(?:\?[^\s"'<>\\]*)?/gi) || [];
  for (const tag of decoded.matchAll(/<(?:meta|source|video)\b[^>]*>/gi)) {
    const attrs = new Map(Array.from(tag[0].matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g), m => [m[1].toLowerCase(), m[2]]));
    const property = attrs.get("property") || attrs.get("name") || "";
    const candidate = /^og:video(?::(?:url|secure_url))?$/.test(property) ? attrs.get("content") : attrs.get("src");
    if (candidate?.startsWith("https://")) candidates.push(candidate);
  }
  // Never fetch arbitrary embedded URLs. A page can contain attacker content.
  const media = candidates.find(candidate => { try { validUrl(candidate); return true; } catch { return false; } });
  if (!media) throw new SessionError(422, fallback);
  return media;
}
export function descriptTitle(html: string): string {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  let title = "";
  for (const tag of tags) {
    const attrs = Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)].map(m => [m[1].toLowerCase(), m[3]]));
    if (attrs.property === "og:title" || attrs.name === "og:title") { title = attrs.content ?? ""; break; }
  }
  title ||= html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  return title.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s*[-|]\s*Descript\s*$/i, "").trim().slice(0, 200);
}
export async function importDescript(raw: string, output: string, onTitle?: (title: string) => void) {
  validateDescriptShareUrl(raw);
  const page = await request(raw);
  let html = "";
  let size = 0;
  for await (const chunk of page) {
    size += chunk.length;
    if (size > 2 * 1024 * 1024) { page.destroy(); throw new SessionError(422, fallback); }
    html += chunk.toString("utf8");
  }
  onTitle?.(descriptTitle(html));
  const media = findDescriptMedia(html);
  const response = await request(media);
  const length = Number(response.headers["content-length"] || 0);
  if (length > MAX_VIDEO_BYTES) { response.destroy(); throw new SessionError(413, "Video exceeds the 250 MiB limit"); }
  let bytes = 0;
  await pipeline(response, new Transform({
    transform(chunk, _encoding, callback) {
      bytes += chunk.length;
      callback(bytes > MAX_VIDEO_BYTES ? new Error("Video exceeds the 250 MiB limit") : null, chunk);
    },
  }), createWriteStream(output, { flags: "wx" }));
  return bytes;
}
