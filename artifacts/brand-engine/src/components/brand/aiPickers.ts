const BASE = import.meta.env.BASE_URL;
const logoFile = (name: string) => `${BASE}assets/logos/${name}`;

export type LogoVariant = {
  id: string;
  name: string;
  file: string;
  description: string;
  recommendedOn: "dark" | "light" | "any";
};

export const LOGO_VARIANTS: LogoVariant[] = [
  {
    id: "wordmark-light",
    name: "Wordmark Light",
    file: logoFile("Lockup=Wordmark, Color=Light.png"),
    description: "white wordmark, ideal on dark backgrounds",
    recommendedOn: "dark",
  },
  {
    id: "wordmark-dark",
    name: "Wordmark Dark",
    file: logoFile("Lockup=Wordmark, Color=Dark.png"),
    description: "dark navy wordmark, ideal on light backgrounds",
    recommendedOn: "light",
  },
  {
    id: "horizontal-light",
    name: "Horizontal Light",
    file: logoFile("Lockup=Full Horizontal, Color=Light.png"),
    description: "full horizontal lockup with white wordmark and color icon",
    recommendedOn: "dark",
  },
  {
    id: "horizontal-allwhite",
    name: "Horizontal All-White",
    file: logoFile("Lockup=Full Horizontal, Color=AllWhite.png"),
    description: "monochrome white horizontal lockup",
    recommendedOn: "dark",
  },
  {
    id: "horizontal-dark",
    name: "Horizontal Dark",
    file: logoFile("Lockup=Full Horizontal, Color=Dark.png"),
    description: "horizontal lockup with dark wordmark and color icon",
    recommendedOn: "light",
  },
  {
    id: "horizontal-alldarkblue",
    name: "Horizontal All Navy",
    file: logoFile("Lockup=Full Horizontal, Color=AllDarkBlue.png"),
    description: "monochrome dark navy horizontal lockup",
    recommendedOn: "light",
  },
  {
    id: "icon-full",
    name: "Icon Color",
    file: logoFile("Lockup=Icon, Color=Full.png"),
    description: "color icon mark only",
    recommendedOn: "any",
  },
  {
    id: "icon-light",
    name: "Icon Light",
    file: logoFile("Lockup=Icon, Color=Light.png"),
    description: "white icon mark only",
    recommendedOn: "dark",
  },
  {
    id: "icon-dark",
    name: "Icon Dark",
    file: logoFile("Lockup=Icon, Color=Dark.png"),
    description: "dark icon mark only",
    recommendedOn: "light",
  },
  {
    id: "circle-ondarkblue",
    name: "Circle Navy",
    file: logoFile("Shape=Circle, Color=OnDarkBlue.png"),
    description: "circular navy badge with icon, profile-style",
    recommendedOn: "any",
  },
  {
    id: "circle-onwhite",
    name: "Circle White",
    file: logoFile("Shape=Circle, Color=OnWhite.png"),
    description: "circular white badge with icon",
    recommendedOn: "any",
  },
  {
    id: "square-ondarkblue",
    name: "Square Navy",
    file: logoFile("Shape=Square, Color=OnDarkBlue.png"),
    description: "square navy badge with icon, app-style",
    recommendedOn: "any",
  },
];

export type DesignScene = {
  id: string;
  name: string;
  description: string;
};

export const DESIGN_SCENES: DesignScene[] = [
  {
    id: "auto",
    name: "Auto — let Claude choose",
    description: "",
  },
  {
    id: "minimal-dark",
    name: "Minimal Dark",
    description:
      "Clean dark navy background (#0B1426) with a single subtle 135° gradient toward #122036. No orbs, no chips. Quiet, editorial, lots of negative space.",
  },
  {
    id: "glow-burst",
    name: "Glow Burst",
    description:
      "Dark navy stage with a large soft radial glow orb in Primary Blue #2896FB positioned off-center (top-right or behind the hero visual). Heavy blur (60-100px), opacity 0.55-0.7. Hero focal point sits inside the glow.",
  },
  {
    id: "studio-spotlight",
    name: "Studio Spotlight",
    description:
      "Cinematic dark stage. Vertical light cone descending from top-center, ellipse at top with soft white-to-transparent gradient. Subject sits centered in the spotlight. Deep navy floor and shadows around the edges.",
  },
  {
    id: "grid-mesh",
    name: "Grid Mesh",
    description:
      "Techy dark navy background with a subtle perspective grid (1px lines, rgba(40,150,251,0.08)) fading toward the horizon. Optional faint scanline overlay. Conveys product/SaaS/data energy.",
  },
  {
    id: "aurora",
    name: "Aurora",
    description:
      "Dark navy base with sweeping conic-gradient or layered radial blooms in teal #00B2A9 and Primary Blue #2896FB across the top half, blurred 80-120px, opacity 0.4-0.6. Calm, atmospheric, premium.",
  },
  {
    id: "confetti-pop",
    name: "Confetti Pop",
    description:
      "Celebratory composition. Dark navy stage with scattered yellow #FFC328 and teal #5EE6DE confetti shapes (small rounded rectangles, circles, plus signs) tumbling at 15-30deg rotations around the edges, never over text. Big punchy headline.",
  },
  {
    id: "workshop-stage",
    name: "Workshop Stage",
    description:
      "Warm event stage feel. Deep navy backdrop with two soft yellow #FFC328 spotlight cones from upper corners (gradient + blur), faint silhouette of audience seats at the very bottom edge in #1A2942. Eyebrow text reads 'WORKSHOP' or 'LIVE EVENT'.",
  },
  {
    id: "product-showcase",
    name: "Product Showcase",
    description:
      "Hero device-mockup energy. Dark navy with one Primary Blue glow behind the focal point, plus 2-3 floating frosted UI chips (rgba(255,255,255,0.06), backdrop-blur, rounded-full) at varying depths around it. Each chip displays a metric or feature word.",
  },
  {
    id: "light-card",
    name: "Light Card",
    description:
      "Inverse palette. Off-white #F8FAFC background with soft inset shadow at the edges. Charcoal #0F172A primary text. Single Primary Blue accent (orb, underline, or pill). Wordmark in dark variant. Use for quote graphics, testimonials, or premium announcements.",
  },
  {
    id: "ad-banner",
    name: "Ad Banner",
    description:
      "High-contrast performance-ad layout. Single hook headline, one CTA button (Primary Blue gradient pill), wordmark in corner. Tight padding. No subhead. Optional one decorative orb. Optimized for tiny canvases and click-through rate.",
  },
  {
    id: "founder-quote",
    name: "Founder Quote",
    description:
      "Editorial quote card. Large opening curly quote mark in #FFC328 at 0.18H font-size top-left of the text block. The quoted line in 0.06H weight 600. Attribution line below in 0.022H uppercase tracked-out, color #94A3B8. Optional small circular avatar to the left of attribution.",
  },
];
