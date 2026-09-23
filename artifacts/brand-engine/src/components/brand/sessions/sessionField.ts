import type { SessionDraft, SessionStore } from "./sessionStore";

/** A newly encountered key must use its own initializer, never another field's local state. */
export function initializeSessionField<T>(draft: SessionDraft, key: string, initial: T | (() => T)): T {
  if (!draft.registered.has(key)) {
    const wasClean = JSON.stringify(draft.state) === draft.baseline;
    if (!Object.hasOwn(draft.state, key)) {
      draft.state[key] = typeof initial === "function" ? (initial as () => T)() : initial;
    }
    draft.registered.add(key);
    if (wasClean) draft.baseline = JSON.stringify(draft.state);
  }
  return draft.state[key] as T;
}

/** A setter owns one mounted field in one exact draft, not whatever draft exists later. */
export function createSessionFieldLease<T>(store: SessionStore, workspace: string, key: string, draft: SessionDraft) {
  const epoch = store.epoch;
  const generation = store.generation;
  const lease = {
    active: true,
    set(action: T | ((previous: T) => T)) {
      if (!lease.active || store.epoch !== epoch || store.generation !== generation || store.drafts.get(workspace) !== draft) return;
      const previous = draft.state[key] as T;
      const next = typeof action === "function" ? (action as (value: T) => T)(previous) : action;
      if (Object.is(previous, next)) return;
      draft.state = { ...draft.state, [key]: next };
      store.emit();
    },
  };
  return lease;
}