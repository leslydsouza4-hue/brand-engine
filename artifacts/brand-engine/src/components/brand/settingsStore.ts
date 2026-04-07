export interface BrandSettings {
  brandName: string;
  primaryColor: string;
  accentColor: string;
  customLogoUrl: string | null;

  defaultExportFormat: "png" | "jpeg";
  defaultExportQuality: number;
  defaultCanvasSize: string;

  aiDefaultStyle: string;
  aiAutoIncludeHighly: boolean;

  theme: "dark" | "light";
  language: string;
}

const STORAGE_KEY = "brand-engine-settings";

const DEFAULT_SETTINGS: BrandSettings = {
  brandName: "HighLevel",
  primaryColor: "#00B2A9",
  accentColor: "#2896FB",
  customLogoUrl: null,

  defaultExportFormat: "png",
  defaultExportQuality: 92,
  defaultCanvasSize: "1080x1080",

  aiDefaultStyle: "photorealistic",
  aiAutoIncludeHighly: true,

  theme: "dark",
  language: "en",
};

export const CANVAS_SIZE_OPTIONS = [
  { value: "1080x1080", label: "Instagram Square (1080×1080)" },
  { value: "1920x1080", label: "YouTube / Presentation (1920×1080)" },
  { value: "1080x1920", label: "Instagram Story (1080×1920)" },
  { value: "1200x628", label: "Facebook / LinkedIn Ad (1200×628)" },
  { value: "1500x500", label: "Twitter Header (1500×500)" },
];

export const AI_STYLE_OPTIONS = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "illustration", label: "Illustration" },
  { value: "3d-render", label: "3D Render" },
  { value: "flat-design", label: "Flat Design" },
  { value: "cinematic", label: "Cinematic" },
  { value: "abstract", label: "Abstract" },
];

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "pt", label: "Português" },
];

export function loadSettings(): BrandSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: BrandSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
  }
  window.dispatchEvent(new CustomEvent("brand-settings-changed", { detail: settings }));
}

export function resetSettings(): BrandSettings {
  localStorage.removeItem(STORAGE_KEY);
  const defaults = { ...DEFAULT_SETTINGS };
  window.dispatchEvent(new CustomEvent("brand-settings-changed", { detail: defaults }));
  return defaults;
}

export { DEFAULT_SETTINGS };
