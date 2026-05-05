import { useEffect, useState } from "react";

export interface LibraryImage {
  id: string;
  driveFileId: string;
  name: string;
  thumbUrl: string;
  fullUrl: string;
  // Structured tags returned by the vision model. Free-form so the user can
  // add anything they like. `peopleCount` is special-cased for matching.
  tags: string[];
  peopleCount: number | null;
  scene: string | null; // "indoor" | "outdoor" | "stage" | etc.
  mood: string | null;
  dominantColors: string[];
  description: string;
  taggedAt: number | null;
  createdAt: number;
}

export interface LibrarySnapshot {
  folderId: string | null;
  folderUrl: string | null;
  images: LibraryImage[];
  lastIngestAt: number | null;
}

const KEY = "brandEngine.levelup26.library.v1";
const listeners = new Set<(s: LibrarySnapshot) => void>();

const EMPTY: LibrarySnapshot = {
  folderId: null,
  folderUrl: null,
  images: [],
  lastIngestAt: null,
};

let current: LibrarySnapshot = (() => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as LibrarySnapshot;
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
})();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* quota */
  }
  listeners.forEach((l) => l(current));
}

export function getLibrary(): LibrarySnapshot {
  return current;
}

export function setLibraryFolder(folderUrl: string, folderId: string) {
  current = { ...current, folderUrl, folderId };
  persist();
}

export function upsertImages(imgs: LibraryImage[]) {
  const map = new Map<string, LibraryImage>();
  for (const i of current.images) map.set(i.driveFileId, i);
  for (const i of imgs) {
    const existing = map.get(i.driveFileId);
    if (existing) {
      // Preserve user-supplied tags + descriptions across re-ingest.
      map.set(i.driveFileId, { ...i, tags: existing.tags.length ? existing.tags : i.tags, taggedAt: existing.taggedAt });
    } else {
      map.set(i.driveFileId, i);
    }
  }
  current = { ...current, images: Array.from(map.values()), lastIngestAt: Date.now() };
  persist();
}

export function updateImage(id: string, patch: Partial<LibraryImage>) {
  current = {
    ...current,
    images: current.images.map((i) => (i.id === id ? { ...i, ...patch } : i)),
  };
  persist();
}

export function removeImage(id: string) {
  current = { ...current, images: current.images.filter((i) => i.id !== id) };
  persist();
}

export function clearLibrary() {
  current = EMPTY;
  persist();
}

export function useLibrary(): LibrarySnapshot {
  const [s, setS] = useState(current);
  useEffect(() => {
    const fn = (n: LibrarySnapshot) => setS(n);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return s;
}

// Lightweight tag-based scorer used by the smart search. The query is
// tokenised and each image is scored by tag overlap, with a strong boost
// when the query mentions an exact people-count.
const STOPWORDS = new Set([
  "a", "an", "and", "the", "of", "with", "in", "on", "at", "for", "to", "from",
  "is", "are", "be", "show", "showing", "image", "images", "photo", "photos", "picture",
  "make", "create", "want", "need", "shot", "photograph", "of", "people", "person",
]);

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

export function extractPeopleCount(q: string): number | null {
  const lower = q.toLowerCase();
  const direct = lower.match(/\b(\d+)\s+(guys?|girls?|men|women|people|persons?|folks?|attendees?|speakers?)\b/);
  if (direct) return parseInt(direct[1], 10);
  for (const [word, n] of Object.entries(NUMBER_WORDS)) {
    const re = new RegExp(`\\b${word}\\s+(guys?|girls?|men|women|people|persons?|folks?|attendees?|speakers?)\\b`);
    if (re.test(lower)) return n;
  }
  if (/\bsolo|alone|single (person|guy|girl)\b/.test(lower)) return 1;
  if (/\bcrowd|audience|group\b/.test(lower)) return 5; // soft hint, used as ≥
  return null;
}

export function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t && t.length > 1 && !STOPWORDS.has(t));
}

export function searchLibrary(images: LibraryImage[], query: string, limit = 12): LibraryImage[] {
  if (!query.trim()) return images.slice(0, limit);
  const tokens = tokenize(query);
  const wantPeople = extractPeopleCount(query);
  const wantCrowd = /\bcrowd|audience|group\b/.test(query.toLowerCase());

  const scored = images.map((img) => {
    let score = 0;
    const hay = [
      ...img.tags,
      img.scene ?? "",
      img.mood ?? "",
      img.description ?? "",
      ...img.dominantColors,
    ]
      .join(" ")
      .toLowerCase();
    for (const t of tokens) {
      if (hay.includes(t)) score += 2;
    }
    if (wantPeople != null && img.peopleCount != null) {
      if (wantCrowd && img.peopleCount >= wantPeople) score += 5;
      else if (img.peopleCount === wantPeople) score += 8;
      else score -= Math.min(4, Math.abs(img.peopleCount - wantPeople));
    }
    return { img, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter((s) => s.score > 0 || !query.trim())
    .slice(0, limit)
    .map((s) => s.img);
}
