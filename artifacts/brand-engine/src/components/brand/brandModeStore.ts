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
    name: "LevelUp 26",
    shortName: "LU26",
    primary: "#096093",
    accent: "#69DDF4",
    cta: "#FFD335",
    bgDeep: "#071a31",
    bgPanel: "#0a233e",
    textOnPrimary: "#FFFFFF",
    fontHeading: "'Poppins', sans-serif",
    fontBody: "'Inter', sans-serif",
    logoIconUrl: `${BASE}levelup26/logo-light.png`,
    logoLockupUrl: `${BASE}levelup26/logo-light.png`,
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
