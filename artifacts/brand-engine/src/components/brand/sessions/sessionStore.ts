import { createContext } from "react";
import type { Session } from "./sessionClient";

export interface SessionDraft {
  state: Record<string, unknown>;
  baseline: string;
  current: Session | null;
  registered: Set<string>;
  loaded: boolean;
}
export class SessionStore {
  drafts = new Map<string, SessionDraft>();
  version = 0;
  epoch = 0;
  generation = 0;
  listeners = new Set<() => void>();
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  snapshot = () => this.version;
  emit = () => { this.version++; this.listeners.forEach(listener => listener()); };
  draft(workspace: string): SessionDraft {
    let draft = this.drafts.get(workspace);
    if (!draft) {
      draft = { state: {}, baseline: "{}", current: null, registered: new Set(), loaded: false };
      this.drafts.set(workspace, draft);
    }
    return draft;
  }
  dirty(workspace: string) { const draft = this.draft(workspace); return JSON.stringify(draft.state) !== draft.baseline; }
  clear() { this.drafts.clear(); this.generation++; this.epoch++; this.emit(); }
}
export const SessionStateContext = createContext<{ store: SessionStore; workspace: string; enabled: boolean } | null>(null);