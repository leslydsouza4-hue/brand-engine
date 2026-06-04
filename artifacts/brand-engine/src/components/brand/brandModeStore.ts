import { useEffect, useState } from "react";

export type BrandMode = "highlevel" | "levelup26" | "summer-of-ai";

const KEY = "brandEngine.brandMode.v1";
const listeners = new Set<(m: BrandMode) => void>();

let current: BrandMode = (() => {
  try {
    const raw = localStorage.getItem(KEY) as BrandMode | null;
    if (raw === "levelup26") return "levelup26";
    if (raw === "summer-of-ai") return "summer-of-ai";
    return "highlevel";
  } catch {
    return "highlevel";
  }
})();

export function getBrandMode(): BrandMode {
  return current;
}

export function setBrandMode(m: BrandMode): void {
  if (current === m) return;
  current = m;
  try {
    localStorage.setItem(KEY, m);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(m));
}

export function useBrandMode(): [BrandMode, (m: BrandMode) => void] {
  const [m, setM] = useState<BrandMode>(current);
  useEffect(() => {
    const fn = (n: BrandMode) => setM(n);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return [m, setBrandMode];
}

export interface BrandTheme {
  name: string;
  shortName: string;
  primary: string;
  accent: string;
  cta: string;
  bgDeep: string;
  bgPanel: string;
  textOnPrimary: string;
  fontHeading: string;
  fontBody: string;
  logoIconUrl: string;
  logoLockupUrl: string;
}

const BASE = import.meta.env.BASE_URL;

export const BRAND_THEMES: Record<BrandMode, BrandTheme> = {
  highlevel: {
    name: "HighLevel",
    shortName: "HL",
    primary: "#00B2A9",
    accent: "#2896FB",
    cta: "#FFD000",
    bgDeep: "#060B16",
    bgPanel: "#030B17",
    textOnPrimary: "#FFFFFF",
    fontHeading: "'Poppins', sans-serif",
    fontBody: "'Inter', sans-serif",
    logoIconUrl: `${BASE}assets/logos/Lockup=Icon, Color=Full.png`,
    logoLockupUrl: `${BASE}assets/logos/Lockup=Full Horizontal, Color=Light.png`,
  },
  levelup26: {
    // Placeholder colors/fonts — designed to be on-brand for a "summit"
    // event vibe. The user will swap these in once the official LevelUp 26
    // brand kit lands. All references go through this object so a single
    // edit updates every surface.
    name: "LevelUp 26",
    shortName: "LU26",
    primary: "#7C3AED", // electric violet
    accent: "#22D3EE", // cyan
    cta: "#FBBF24", // amber
    bgDeep: "#0A0118",
    bgPanel: "#10031F",
    textOnPrimary: "#FFFFFF",
    fontHeading: "'Poppins', sans-serif",
    fontBody: "'Inter', sans-serif",
    logoIconUrl: `${BASE}assets/levelup26/logo-icon.svg`,
    logoLockupUrl: `${BASE}assets/levelup26/logo-lockup.svg`,
  },
  "summer-of-ai": {
    // Top-level "Summer of AI" campaign identity. The three sub-themes
    // (Sun Drunk / Electric / Feral) carry their own distinct palettes in
    // summerThemes.ts — this object only drives the brand chip + app bg.
    name: "Summer of AI",
    shortName: "SOA",
    primary: "#FF7A3D", // sunset orange
    accent: "#2EC5FF", // electric blue
    cta: "#FFC83D", // warm gold
    bgDeep: "#0E0A14",
    bgPanel: "#16101D",
    textOnPrimary: "#FFFFFF",
    fontHeading: "'Bebas Neue', sans-serif",
    fontBody: "'Inter', sans-serif",
    logoIconUrl: `${BASE}assets/summer/logo-icon.svg`,
    logoLockupUrl: `${BASE}assets/summer/logo-icon.svg`,
  },
};

export function getActiveTheme(): BrandTheme {
  return BRAND_THEMES[current];
}
