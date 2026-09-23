import { useContext, useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Dispatch, SetStateAction } from "react";
import { SessionStateContext } from "./sessionStore";
import { createSessionFieldLease, initializeSessionField } from "./sessionField";

const noSubscribe = () => () => {};
const zero = () => 0;

export function useSessionState<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const context = useContext(SessionStateContext);
  const active = context?.enabled ? context : null;
  const [local, setLocal] = useState<T>(() => {
    if (active) {
      const draft = active.store.draft(active.workspace);
      return initializeSessionField(draft, key, initial);
    }
    return typeof initial === "function" ? (initial as () => T)() : initial;
  });
  useSyncExternalStore(active?.store.subscribe ?? noSubscribe, active?.store.snapshot ?? zero, zero);
  const draft = active?.store.draft(active.workspace);
  if (draft) initializeSessionField(draft, key, initial);
  const lease = useMemo(() => active && draft
    ? createSessionFieldLease<T>(active.store, active.workspace, key, draft)
    : null,
  [active?.store, active?.workspace, key, draft, active?.store.epoch, active?.store.generation]);
  useLayoutEffect(() => {
    if (!lease) return;
    lease.active = true;
    // Layout cleanup invalidates setters before promises from a removed editor can resolve.
    return () => { lease.active = false; };
  }, [lease]);
  useEffect(() => { active?.store.emit(); }, [active?.store, active?.workspace, key]);
  return [draft ? draft.state[key] as T : local, lease?.set ?? setLocal];
}