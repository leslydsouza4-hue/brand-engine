import { cloneSessionState } from "./sessionAssets";
import type { SessionStore } from "./sessionStore";

const key = "brand-engine:anonymous-sign-in-draft:v1";
/** Only invoked deliberately before auth navigation; never stores signed-in/private drafts. */
export async function preserveAnonymousDraft(store: SessionStore, workspace: string) {
  async function portable(value: unknown): Promise<unknown> {
    if (typeof value === "string" && value.startsWith("blob:")) {
      const response = await fetch(value);
      if (!response.ok) throw new Error("Could not preserve an uploaded image before sign-in");
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not preserve an uploaded image before sign-in"));
        reader.readAsDataURL(blob);
      });
    }
    if (Array.isArray(value)) return Promise.all(value.map(portable));
    if (value && typeof value === "object") return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([name, item]) => [name, await portable(item)])));
    return value;
  }
  const drafts = await Promise.all([...store.drafts.entries()].map(async ([mode, draft]) => {
    if (draft.current) throw new Error("Private saved sessions cannot be preserved as anonymous drafts");
    return { mode, state: await portable(cloneSessionState(draft.state)), baseline: draft.baseline };
  }));
  try { sessionStorage.setItem(key, JSON.stringify({ expires: Date.now() + 30 * 60 * 1000, workspace, drafts })); }
  catch { throw new Error("This draft is too large for sign-in navigation. Use sign-in in a modal to keep the editor mounted, or reduce uploaded images."); }
}

export function consumeAnonymousDraft(store: SessionStore, supported: readonly string[]): string | null {
  const text = sessionStorage.getItem(key);
  if (!text) return null;
  sessionStorage.removeItem(key);
  const parsed = JSON.parse(text);
  if (typeof parsed.expires !== "number" || parsed.expires < Date.now() || !Array.isArray(parsed.drafts)) return null;
  for (const item of parsed.drafts) {
    if (!supported.includes(item.mode) || !item.state || typeof item.state !== "object" || Array.isArray(item.state)) continue;
    const state = cloneSessionState(item.state) as Record<string, unknown>;
    // Existing mounted edits win over an earlier sign-in snapshot.
    if (Object.keys(store.draft(item.mode).state).length && store.dirty(item.mode)) continue;
    store.drafts.set(item.mode, { state, baseline: typeof item.baseline === "string" ? item.baseline : "{}", current: null, loaded: true, registered: new Set() });
  }
  store.epoch++; store.emit();
  return supported.includes(parsed.workspace) ? parsed.workspace : null;
}

export function discardAnonymousDraft() { sessionStorage.removeItem(key); }