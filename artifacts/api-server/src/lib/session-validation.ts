import { z } from "zod";

export class SessionError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}

export function assertSessionMutationOrigin(request: {
  method: string;
  protocol: string;
  get(name: string): string | undefined;
}) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origin = request.get("origin");
  const host = (request.get("x-forwarded-host") || request.get("host") || "").split(",")[0].trim();
  const protocol = (request.get("x-forwarded-proto") || request.protocol).split(",")[0].trim();
  const deny = () => new SessionError(403, "A valid same-origin Origin header is required", "CSRF_ORIGIN_DENIED");
  if (!origin || !host || !["https", "http"].includes(protocol)) throw deny();
  try {
    const supplied = new URL(origin);
    const expected = new URL(`${protocol}://${host}`);
    // Origin headers are serialized origins, not arbitrary URLs. In particular,
    // reject null, credentials, paths, query/hash, lists and protocol mismatches.
    if (supplied.origin !== origin || expected.origin !== supplied.origin ||
      request.get("sec-fetch-site") === "cross-site") throw deny();
  } catch {
    throw deny();
  }
}

export const idSchema = z.string().uuid();
export const nameSchema = z.string().trim().min(1).max(160);
export const saveSchema = z.object({
  name: nameSchema, workspaceType: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
  schemaVersion: z.literal(1), state: z.record(z.string(), z.unknown()),
  thumbnailAssetId: idSchema.nullable().optional(),
}).strict();
export const updateSchema = saveSchema.extend({ revision: z.number().int().positive() });
export const patchSchema = z.object({
  revision: z.number().int().positive(), name: nameSchema.optional(), archived: z.boolean().optional(),
}).strict().refine(v => v.name !== undefined || v.archived !== undefined, "No changes supplied");
export const assetSchema = z.object({
  name: nameSchema,
  contentType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]),
  size: z.number().int().min(1).max(25 * 1024 * 1024),
}).strict();

export function collectAssetIds(state: unknown): string[] {
  const ids = new Set<string>();
  let nodes = 0;
  function visit(value: unknown, depth: number) {
    if (++nodes > 100000 || depth > 60) throw new SessionError(400, "State is too complex");
    if (typeof value === "string") {
      if (/(?:data|blob)\s*:/i.test(value) || /\/session-teams\/[^/]+\/assets\//i.test(value)) {
        throw new SessionError(400, "Use asset tags instead of inline images or asset serving URLs");
      }
    } else if (Array.isArray(value)) value.forEach(v => visit(v, depth + 1));
    else if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      if ("__brandAsset" in obj) {
        if (Object.keys(obj).length !== 1 || !idSchema.safeParse(obj.__brandAsset).success)
          throw new SessionError(400, "Invalid asset tag");
        ids.add(obj.__brandAsset as string);
      } else Object.values(obj).forEach(v => visit(v, depth + 1));
    } else if (value !== null && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value))) {
      throw new SessionError(400, "State must be JSON");
    }
  }
  if (Buffer.byteLength(JSON.stringify(state)) > 5 * 1024 * 1024) throw new SessionError(413, "State exceeds 5MB");
  visit(state, 0);
  return [...ids];
}

export function assertReadyAssets(ids: string[], assets: { id: string; teamId: string; ready: boolean }[], teamId: string) {
  if (ids.some(id => !assets.some(a => a.id === id && a.teamId === teamId && a.ready)))
    throw new SessionError(400, "Asset is missing, incomplete, or belongs to another team", "INVALID_ASSET");
}