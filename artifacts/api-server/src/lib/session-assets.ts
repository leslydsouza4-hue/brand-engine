import sharp from "sharp";
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient } from "./objectStorage";
import { SessionError } from "./session-validation";

export const sessionStorage = new ObjectStorageService();

// A signed PUT remains reusable until expiry. Complete copies into an unguessable,
// never-signed final object and validates that copy, never the mutable staging key.
export async function completePrivateImage(objectPath: string, contentType: string, size: number, finalId: string) {
  const staging = await sessionStorage.getObjectEntityFile(objectPath).catch(error => {
    if (error instanceof ObjectNotFoundError) throw new SessionError(400, "Upload has not arrived. Upload the image before completing.");
    throw error;
  });
  const root = sessionStorage.getPrivateObjectDir().replace(/^\/|\/$/g, "").split("/");
  const bucket = root.shift()!;
  const finalPath = `saved-sessions/${finalId}`;
  const target = objectStorageClient.bucket(bucket).file(`${root.join("/")}/${finalPath}`);
  await staging.copy(target, { preconditionOpts: { ifGenerationMatch: 0 } });
  try {
    const [meta] = await target.getMetadata();
    if (Number(meta.size) !== size || meta.contentType !== contentType)
      throw new SessionError(400, "Uploaded image size or content type does not match");
    const [bytes] = await target.download();
    await validateImageBytes(bytes, contentType);
    await target.setMetadata({ cacheControl: "private, no-store" });
    return `/objects/${finalPath}`;
  } catch (error) {
    await target.delete().catch(() => undefined);
    throw error;
  }
}

export async function validateImageBytes(bytes: Buffer, contentType: string) {
  if (contentType === "image/svg+xml") {
    const text = bytes.toString("utf8");
    // SVG is served with sandbox CSP as defense in depth; reject active content,
    // entities and external resources, including CSS URLs and event attributes.
    if (!/^\s*(?:<\?xml[^?]*\?>\s*)?<svg[\s>]/i.test(text) ||
      /<!|<\s*(?:script|foreignObject|iframe|object|embed|style|image|use|animate|set)\b|\bon[a-z]+\s*=|(?:href|src)\s*=|url\s*\(|@import|javascript:|data:|\\[0-9a-f]{1,6}/i.test(text))
      throw new SessionError(400, "SVG contains unsupported or unsafe content");
  }
  try {
    const meta = await sharp(bytes, { limitInputPixels: 100_000_000 }).metadata();
    const expected: Record<string, string> = {
      "image/png": "png", "image/jpeg": "jpeg", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg",
    };
    if (meta.format !== expected[contentType] || !meta.width || !meta.height) throw new Error("type mismatch");
  } catch {
    throw new SessionError(400, "Invalid image bytes or image type mismatch");
  }
}