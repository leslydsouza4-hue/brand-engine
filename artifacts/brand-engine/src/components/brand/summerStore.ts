// Per-theme AI asset library for Summer of AI.
//
// Every image generated inside a Summer of AI theme is saved here (as a data
// URL) so it can be reused as a background across formats and browsed in the
// Asset Library tab. Persisted to localStorage, keyed per theme.

import { useEffect, useState } from "react";
import type { SummerThemeId } from "./summerThemes";

export interface SummerAsset {
  id: string;
  themeId: SummerThemeId;
  dataUrl: string;
  prompt: string;
  createdAt: number;
}

const KEY = "brandEngine.summerAssets.v1";
// Generated backgrounds are large base64 data URLs; localStorage is ~5MB, so we
// cap how many we keep PER THEME and evict the oldest on overflow / quota error.
const MAX_PER_THEME = 24;
const listeners = new Set<(a: SummerAsset[]) => void>();

let assets: SummerAsset[] = (() => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SummerAsset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
})();

/**
 * Write to localStorage. On a quota error, drop the oldest asset and retry until
 * it fits (or nothing is left). Returns false if the write ultimately failed —
 * callers can surface this so the user knows the asset won't survive a reload.
 */
function persist(): boolean {
  let ok = true;
  for (;;) {
    try {
      localStorage.setItem(KEY, JSON.stringify(assets));
      ok = true;
      break;
    } catch {
      // Evict the oldest asset (smallest createdAt) and retry.
      if (assets.length === 0) {
        ok = false;
        break;
      }
      let oldestIdx = 0;
      for (let i = 1; i < assets.length; i++) {
        if (assets[i].createdAt < assets[oldestIdx].createdAt) oldestIdx = i;
      }
      assets = assets.filter((_, i) => i !== oldestIdx);
    }
  }
  listeners.forEach((l) => l(assets));
  return ok;
}

export function getSummerAssets(themeId: SummerThemeId): SummerAsset[] {
  return assets.filter((a) => a.themeId === themeId);
}

export interface AddAssetResult {
  asset: SummerAsset;
  persisted: boolean;
}

export function addSummerAsset(themeId: SummerThemeId, dataUrl: string, prompt: string): AddAssetResult {
  const asset: SummerAsset = {
    id: `soa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    themeId,
    dataUrl,
    prompt,
    createdAt: Date.now(),
  };
  // Keep only the most recent MAX_PER_THEME for this theme; other themes untouched.
  const sameTheme = [asset, ...assets.filter((a) => a.themeId === themeId)].slice(0, MAX_PER_THEME);
  const sameThemeIds = new Set(sameTheme.map((a) => a.id));
  assets = [...sameTheme, ...assets.filter((a) => a.themeId !== themeId && !sameThemeIds.has(a.id))];
  const persisted = persist();
  return { asset, persisted };
}

export function removeSummerAsset(id: string): void {
  assets = assets.filter((a) => a.id !== id);
  persist();
}

/** Subscribe to the asset list for a single theme. */
export function useSummerAssets(themeId: SummerThemeId): SummerAsset[] {
  const [list, setList] = useState<SummerAsset[]>(() => getSummerAssets(themeId));
  useEffect(() => {
    const fn = () => setList(getSummerAssets(themeId));
    fn();
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, [themeId]);
  return list;
}
