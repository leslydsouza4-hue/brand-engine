export interface ExportRecord {
  id: string;
  name: string;
  source: string;
  format: string;
  thumbnail: string;
  timestamp: number;
  dimensions?: string;
  // Brand mode this export belongs to. Lets the History/Exports view filter
  // and group exports per brand world (HighLevel vs LevelUp 26).
  mode?: "highlevel" | "levelup26";
  // Template id used for the render (when applicable). Useful for
  // "show me everything I've ever made with this template".
  templateId?: string;
}

const STORAGE_KEY = "brand-engine-exports";
const MAX_EXPORTS = 100;

export function getExports(): ExportRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addExport(record: Omit<ExportRecord, "id" | "timestamp">): void {
  const exports = getExports();
  const newRecord: ExportRecord = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };
  exports.unshift(newRecord);
  if (exports.length > MAX_EXPORTS) exports.length = MAX_EXPORTS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exports));
  window.dispatchEvent(new CustomEvent("exports-updated"));
}

export function deleteExport(id: string): void {
  const exports = getExports().filter((e) => e !== null && e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exports));
  window.dispatchEvent(new CustomEvent("exports-updated"));
}

export function clearExports(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("exports-updated"));
}

export function createThumbnail(dataUrl: string, maxSize = 200): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
