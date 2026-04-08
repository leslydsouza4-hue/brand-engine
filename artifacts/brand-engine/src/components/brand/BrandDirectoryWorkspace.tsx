import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Search, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface AssetItem {
  name: string;
  file: string;
  preview: string;
}

interface AssetCategory {
  id: string;
  title: string;
  description: string;
  color: string;
  items: AssetItem[];
}

const BRAND_COLORS = [
  { name: "Deep Navy", hex: "#060B16", usage: "Primary background" },
  { name: "Brand Teal", hex: "#00B2A9", usage: "Primary accent" },
  { name: "Electric Blue", hex: "#2896FB", usage: "Secondary accent" },
  { name: "Royal Blue", hex: "#095DC3", usage: "Gradients, CTAs" },
  { name: "Cyan Glow", hex: "#20EDF1", usage: "Highlights, neon text" },
  { name: "Arrow Yellow", hex: "#FBBF24", usage: "Logo arrow (left)" },
  { name: "Arrow Blue", hex: "#3B82F6", usage: "Logo arrow (center)" },
  { name: "Arrow Green", hex: "#22C55E", usage: "Logo arrow (right)" },
];

const CATEGORIES: AssetCategory[] = [
  {
    id: "logos",
    title: "Logos & Lockups",
    description: "Official HighLevel logo variations for all use cases",
    color: "#00B2A9",
    items: [
      { name: "Full Horizontal — Light", file: "logos/Lockup=Full Horizontal, Color=Light.png", preview: `${BASE}assets/logos/Lockup=Full Horizontal, Color=Light.png` },
      { name: "Full Horizontal — Dark", file: "logos/Lockup=Full Horizontal, Color=Dark.png", preview: `${BASE}assets/logos/Lockup=Full Horizontal, Color=Dark.png` },
      { name: "Full Horizontal — All White", file: "logos/Lockup=Full Horizontal, Color=AllWhite.png", preview: `${BASE}assets/logos/Lockup=Full Horizontal, Color=AllWhite.png` },
      { name: "Full Horizontal — All Dark Blue", file: "logos/Lockup=Full Horizontal, Color=AllDarkBlue.png", preview: `${BASE}assets/logos/Lockup=Full Horizontal, Color=AllDarkBlue.png` },
      { name: "Icon — Full Color", file: "logos/Lockup=Icon, Color=Full.png", preview: `${BASE}assets/logos/Lockup=Icon, Color=Full.png` },
      { name: "Icon — Dark", file: "logos/Lockup=Icon, Color=Dark.png", preview: `${BASE}assets/logos/Lockup=Icon, Color=Dark.png` },
      { name: "Icon — Light", file: "logos/Lockup=Icon, Color=Light.png", preview: `${BASE}assets/logos/Lockup=Icon, Color=Light.png` },
      { name: "Wordmark — Dark", file: "logos/Lockup=Wordmark, Color=Dark.png", preview: `${BASE}assets/logos/Lockup=Wordmark, Color=Dark.png` },
      { name: "Wordmark — Light", file: "logos/Lockup=Wordmark, Color=Light.png", preview: `${BASE}assets/logos/Lockup=Wordmark, Color=Light.png` },
      { name: "Circle — On Dark Blue", file: "logos/Shape=Circle, Color=OnDarkBlue.png", preview: `${BASE}assets/logos/Shape=Circle, Color=OnDarkBlue.png` },
      { name: "Circle — On White", file: "logos/Shape=Circle, Color=OnWhite.png", preview: `${BASE}assets/logos/Shape=Circle, Color=OnWhite.png` },
      { name: "Rounded Square — On Dark Blue", file: "logos/Shape=Light Mode Rounded Square, Color=OnDarkBlue.png", preview: `${BASE}assets/logos/Shape=Light Mode Rounded Square, Color=OnDarkBlue.png` },
      { name: "Rounded Square — On White", file: "logos/Shape=RoundedSquare, Color=OnWhite.png", preview: `${BASE}assets/logos/Shape=RoundedSquare, Color=OnWhite.png` },
      { name: "Square — On Dark Blue", file: "logos/Shape=Square, Color=OnDarkBlue.png", preview: `${BASE}assets/logos/Shape=Square, Color=OnDarkBlue.png` },
      { name: "Square — On White", file: "logos/Shape=Square, Color=OnWhite.png", preview: `${BASE}assets/logos/Shape=Square, Color=OnWhite.png` },
    ],
  },
  {
    id: "highly",
    title: "Highly Mascot",
    description: "Official HighLevel AI mascot poses — transparent PNG",
    color: "#2896FB",
    items: [
      { name: "Waving Hi", file: "highly/highly-waving.png", preview: `${BASE}assets/highly/highly-waving.png` },
      { name: "Happy Hover", file: "highly/highly-happy-hover.png", preview: `${BASE}assets/highly/highly-happy-hover.png` },
      { name: "Pointing Up", file: "highly/highly-pointing-up.png", preview: `${BASE}assets/highly/highly-pointing-up.png` },
      { name: "Pointing Left", file: "highly/highly-pointing-left.png", preview: `${BASE}assets/highly/highly-pointing-left.png` },
      { name: "Happy Pointing", file: "highly/highly-happy-pointing.png", preview: `${BASE}assets/highly/highly-happy-pointing.png` },
      { name: "Professor", file: "highly/highly-professor.png", preview: `${BASE}assets/highly/highly-professor.png` },
      { name: "Tablet", file: "highly/highly-tablet.png", preview: `${BASE}assets/highly/highly-tablet.png` },
      { name: "Happy Laptop", file: "highly/highly-happy-laptop.png", preview: `${BASE}assets/highly/highly-happy-laptop.png` },
      { name: "Heart Laptop", file: "highly/highly-heart-laptop.png", preview: `${BASE}assets/highly/highly-heart-laptop.png` },
      { name: "Heart Eyes Hover", file: "highly/highly-heart-eyes-hover.png", preview: `${BASE}assets/highly/highly-heart-eyes-hover.png` },
      { name: "Heart Eyes Pointing", file: "highly/highly-heart-eyes-pointing.png", preview: `${BASE}assets/highly/highly-heart-eyes-pointing.png` },
      { name: "Money Eyes", file: "highly/highly-money-eyes.png", preview: `${BASE}assets/highly/highly-money-eyes.png` },
      { name: "Thinking", file: "highly/highly-thinking.png", preview: `${BASE}assets/highly/highly-thinking.png` },
      { name: "Working", file: "highly/highly-working.png", preview: `${BASE}assets/highly/highly-working.png` },
      { name: "Flying", file: "highly/Highly_Flying 1.png", preview: `${BASE}assets/highly/Highly_Flying 1.png` },
      { name: "Hi Pose", file: "highly/Highly_Hi 1.png", preview: `${BASE}assets/highly/Highly_Hi 1.png` },
      { name: "Grab Right", file: "highly/Highly_Pose_GrabRight 1.png", preview: `${BASE}assets/highly/Highly_Pose_GrabRight 1.png` },
    ],
  },
  {
    id: "backgrounds-dark",
    title: "Backgrounds — Dark",
    description: "Dark brand backgrounds for presentations and social",
    color: "#095DC3",
    items: [
      { name: "Core Gradient", file: "backgrounds-dark/Type=Core Gradient.png", preview: `${BASE}assets/backgrounds-dark/Type=Core Gradient.png` },
      { name: "Centered Planet", file: "backgrounds-dark/Type=Centered Planet.png", preview: `${BASE}assets/backgrounds-dark/Type=Centered Planet.png` },
      { name: "Large Planet Bottom Right", file: "backgrounds-dark/Type=Large Planet Bottom Right.png", preview: `${BASE}assets/backgrounds-dark/Type=Large Planet Bottom Right.png` },
      { name: "Planet Bottom Right", file: "backgrounds-dark/Type=Planet Bottom Right.png", preview: `${BASE}assets/backgrounds-dark/Type=Planet Bottom Right.png` },
      { name: "Planet Ray Bottom Right", file: "backgrounds-dark/Type=Planet Ray Bottom Right.png", preview: `${BASE}assets/backgrounds-dark/Type=Planet Ray Bottom Right.png` },
      { name: "Small Planet Bottom Right", file: "backgrounds-dark/Type=Small Planet Bottom Right.png", preview: `${BASE}assets/backgrounds-dark/Type=Small Planet Bottom Right.png` },
      { name: "Radial Shine Bottom Left", file: "backgrounds-dark/Type=Radial Shine Bottom Left.png", preview: `${BASE}assets/backgrounds-dark/Type=Radial Shine Bottom Left.png` },
      { name: "Radial Shine Bottom Right", file: "backgrounds-dark/Type=Radial Shine Bottom RIght.png", preview: `${BASE}assets/backgrounds-dark/Type=Radial Shine Bottom RIght.png` },
      { name: "Small Radial Shine Right", file: "backgrounds-dark/Type=Small Radial Shine Right.png", preview: `${BASE}assets/backgrounds-dark/Type=Small Radial Shine Right.png` },
    ],
  },
  {
    id: "backgrounds-light",
    title: "Backgrounds — Light",
    description: "Light brand backgrounds",
    color: "#20EDF1",
    items: [
      { name: "Centered Horizon", file: "backgrounds-light/Property 1=Centered Horizon.png", preview: `${BASE}assets/backgrounds-light/Property 1=Centered Horizon.png` },
      { name: "Neutral", file: "backgrounds-light/Property 1=Neutral.png", preview: `${BASE}assets/backgrounds-light/Property 1=Neutral.png` },
    ],
  },
  {
    id: "icons",
    title: "Product Icons",
    description: "Glass-style product feature icons",
    color: "#FBBF24",
    items: [
      { name: "Capture — Dark Glass", file: "icons/Icon=Capture, Glass=Dark, Color=None (Glass).png", preview: `${BASE}assets/icons/Icon=Capture, Glass=Dark, Color=None (Glass).png` },
      { name: "Capture — Medium Glass", file: "icons/Icon=Capture, Glass=Medium, Color=None (Glass).png", preview: `${BASE}assets/icons/Icon=Capture, Glass=Medium, Color=None (Glass).png` },
      { name: "Close — Medium Glass", file: "icons/Icon=Close, Glass=Medium, Color=None (Glass).png", preview: `${BASE}assets/icons/Icon=Close, Glass=Medium, Color=None (Glass).png` },
      { name: "Evangelize — Medium Glass", file: "icons/Icon=Evangelize, Glass=Medium, Color=None (Glass).png", preview: `${BASE}assets/icons/Icon=Evangelize, Glass=Medium, Color=None (Glass).png` },
      { name: "Nurture — Medium Glass", file: "icons/Icon=Nurture, Glass=Medium, Color=None (Glass).png", preview: `${BASE}assets/icons/Icon=Nurture, Glass=Medium, Color=None (Glass).png` },
      { name: "Reactivate — Medium Glass", file: "icons/Icon=Reactivate, Glass=Medium, Color=None (Glass).png", preview: `${BASE}assets/icons/Icon=Reactivate, Glass=Medium, Color=None (Glass).png` },
    ],
  },
  {
    id: "orbits",
    title: "Orbit Rings",
    description: "Decorative orbit ring graphics for compositions",
    color: "#22C55E",
    items: [
      { name: "6 Ring — Standard", file: "orbits/Rings=6 Ring, Color=Standard.png", preview: `${BASE}assets/orbits/Rings=6 Ring, Color=Standard.png` },
      { name: "6 Ring — Capture", file: "orbits/Rings=6 Ring, Color=Capture.png", preview: `${BASE}assets/orbits/Rings=6 Ring, Color=Capture.png` },
      { name: "6 Ring — Close", file: "orbits/Rings=6 Ring, Color=Close.png", preview: `${BASE}assets/orbits/Rings=6 Ring, Color=Close.png` },
      { name: "6 Ring — Nurture", file: "orbits/Rings=6 Ring, Color=Nurture.png", preview: `${BASE}assets/orbits/Rings=6 Ring, Color=Nurture.png` },
      { name: "6 Ring — Dark", file: "orbits/Rings=6 Ring, Color=Dark.png", preview: `${BASE}assets/orbits/Rings=6 Ring, Color=Dark.png` },
      { name: "6 Ring — Engine Light", file: "orbits/Rings=6 Ring, Color=Engine Light.png", preview: `${BASE}assets/orbits/Rings=6 Ring, Color=Engine Light.png` },
      { name: "6 Ring — Backer", file: "orbits/Rings=6 Ring, Color=Backer.png", preview: `${BASE}assets/orbits/Rings=6 Ring, Color=Backer.png` },
      { name: "8 Ring — Standard", file: "orbits/Rings=8 Ring, Color=Standard.png", preview: `${BASE}assets/orbits/Rings=8 Ring, Color=Standard.png` },
      { name: "8 Ring — Capture", file: "orbits/Rings=8 Ring, Color=Capture.png", preview: `${BASE}assets/orbits/Rings=8 Ring, Color=Capture.png` },
      { name: "8 Ring — Close", file: "orbits/Rings=8 Ring, Color=Close.png", preview: `${BASE}assets/orbits/Rings=8 Ring, Color=Close.png` },
      { name: "8 Ring — Nurture", file: "orbits/Rings=8 Ring, Color=Nurture.png", preview: `${BASE}assets/orbits/Rings=8 Ring, Color=Nurture.png` },
      { name: "8 Ring — Engine Dark", file: "orbits/Rings=8 Ring, Color=Engine Dark.png", preview: `${BASE}assets/orbits/Rings=8 Ring, Color=Engine Dark.png` },
      { name: "8 Ring — Engine Light", file: "orbits/Rings=8 Ring, Color=Engine Light.png", preview: `${BASE}assets/orbits/Rings=8 Ring, Color=Engine Light.png` },
      { name: "8 Ring — Backer", file: "orbits/Rings=8 Ring, Color=Backer.png", preview: `${BASE}assets/orbits/Rings=8 Ring, Color=Backer.png` },
    ],
  },
  {
    id: "bundles",
    title: "Product Bundles",
    description: "Feature bundle graphics — Capture, Close, Nurture",
    color: "#FF6B6B",
    items: [
      { name: "Narrow — Capture Yellow", file: "bundles/Type=Narrow, Color=Capture Yellow.png", preview: `${BASE}assets/bundles/Type=Narrow, Color=Capture Yellow.png` },
      { name: "Narrow — Close Green", file: "bundles/Type=Narrow, Color=Close Green.png", preview: `${BASE}assets/bundles/Type=Narrow, Color=Close Green.png` },
      { name: "Narrow — Nurture Blue", file: "bundles/Type=Narrow, Color=Nurture Blue.png", preview: `${BASE}assets/bundles/Type=Narrow, Color=Nurture Blue.png` },
      { name: "Wide — Capture Yellow", file: "bundles/Type=Wide, Color=Capture Yellow.png", preview: `${BASE}assets/bundles/Type=Wide, Color=Capture Yellow.png` },
      { name: "Wide — Close Green", file: "bundles/Type=Wide, Color=Close Green.png", preview: `${BASE}assets/bundles/Type=Wide, Color=Close Green.png` },
      { name: "Wide — Nurture Blue", file: "bundles/Type=Wide, Color=Nurture Blue.png", preview: `${BASE}assets/bundles/Type=Wide, Color=Nurture Blue.png` },
      { name: "Product UI — Capture", file: "bundles/Type=Product UI (Frosted), Color=Capture Yellow.png", preview: `${BASE}assets/bundles/Type=Product UI (Frosted), Color=Capture Yellow.png` },
      { name: "Product UI — Close", file: "bundles/Type=Product UI (Frosted), Color=Close Green.png", preview: `${BASE}assets/bundles/Type=Product UI (Frosted), Color=Close Green.png` },
      { name: "Product UI — Nurture", file: "bundles/Type=Product UI (Frosted), Color=Nurture Blue.png", preview: `${BASE}assets/bundles/Type=Product UI (Frosted), Color=Nurture Blue.png` },
    ],
  },
];

function downloadAsset(filePath: string, name: string) {
  const url = `${BASE}assets/${filePath}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = name.replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_") + ".png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function BrandDirectoryWorkspace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["logos"]));

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isSearching = searchQuery.trim().length > 0;

  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || cat.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  const totalAssets = CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-[16px] md:px-[40px] py-[24px]">
        <div className="max-w-[1100px] mx-auto">
          <div className="mb-[28px]">
            <h1 className="text-[22px] font-bold text-white mb-[4px]">Brand Directory</h1>
            <p className="text-[13px] text-[#64748B]">
              {totalAssets} official HighLevel brand assets — logos, backgrounds, mascots, icons, and more. Click to download.
            </p>
          </div>

          <div className="relative mb-[24px]">
            <Search className="absolute left-[14px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#475569]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full py-[11px] pl-[40px] pr-[16px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[12px] text-white font-['Poppins'] text-[13px] outline-none focus:border-[rgba(0,178,169,0.3)] placeholder:text-[#475569] transition-all"
            />
          </div>

          {!isSearching && <div className="mb-[32px] p-[20px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[16px]">
            <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[14px]">Brand Colors</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px]">
              {BRAND_COLORS.map(c => (
                <div
                  key={c.hex}
                  className="flex items-center gap-[10px] py-[8px] px-[10px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-[10px] cursor-pointer hover:border-[rgba(255,255,255,0.1)] transition-all group"
                  onClick={() => navigator.clipboard.writeText(c.hex)}
                  title="Click to copy hex"
                >
                  <div
                    className="w-[28px] h-[28px] rounded-[8px] shrink-0 border border-[rgba(255,255,255,0.1)]"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-white truncate">{c.name}</div>
                    <div className="text-[10px] text-[#64748B] font-mono group-hover:text-[#00B2A9] transition-colors">{c.hex}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-[10px] text-[10px] text-[#475569]">
              Font: Poppins (all weights) — click any swatch to copy hex code
            </div>
          </div>}

          <div className="flex flex-col gap-[8px]">
            {filteredCategories.map(cat => {
              const isExpanded = isSearching || expandedCategories.has(cat.id);
              return (
                <div
                  key={cat.id}
                  className="bg-[rgba(255,255,255,0.015)] border border-[rgba(255,255,255,0.05)] rounded-[14px] overflow-hidden"
                >
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center gap-[12px] py-[14px] px-[18px] cursor-pointer bg-transparent border-none transition-all hover:bg-[rgba(255,255,255,0.02)]"
                  >
                    <div
                      className="w-[8px] h-[8px] rounded-full shrink-0"
                      style={{ backgroundColor: cat.color, boxShadow: `0 0 10px ${cat.color}40` }}
                    />
                    <div className="flex-1 text-left">
                      <div className="text-[13px] font-semibold text-white">{cat.title}</div>
                      <div className="text-[11px] text-[#64748B]">{cat.description}</div>
                    </div>
                    <span className="text-[11px] text-[#475569] font-medium mr-[8px]">{cat.items.length} assets</span>
                    {isExpanded
                      ? <ChevronDown className="w-[16px] h-[16px] text-[#475569]" />
                      : <ChevronRight className="w-[16px] h-[16px] text-[#475569]" />
                    }
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-[18px] pb-[16px]">
                          <div className={`grid gap-[10px] ${
                            cat.id === "highly"
                              ? "grid-cols-3 md:grid-cols-5"
                              : cat.id === "logos"
                                ? "grid-cols-2 md:grid-cols-4"
                                : "grid-cols-2 md:grid-cols-3"
                          }`}>
                            {cat.items.map(item => (
                              <motion.div
                                key={item.file}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative rounded-[10px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] overflow-hidden hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer"
                                onClick={() => downloadAsset(item.file, item.name)}
                              >
                                <div className={`w-full flex items-center justify-center p-[8px] ${
                                  cat.id === "backgrounds-dark"
                                    ? "aspect-[16/9]"
                                    : cat.id === "backgrounds-light"
                                      ? "aspect-[16/9]"
                                      : cat.id === "highly"
                                        ? "aspect-square"
                                        : "aspect-square"
                                }`}>
                                  <img
                                    src={item.preview}
                                    alt={item.name}
                                    className={`max-w-full max-h-full object-contain ${
                                      cat.id === "backgrounds-dark" || cat.id === "backgrounds-light" || cat.id === "bundles"
                                        ? "w-full h-full object-cover rounded-[4px]"
                                        : ""
                                    }`}
                                    loading="lazy"
                                  />
                                </div>
                                <div className="py-[6px] px-[8px] bg-[rgba(0,0,0,0.2)] flex items-center justify-between gap-[4px]">
                                  <span className="text-[9px] font-medium text-[#94A3B8] truncate">{item.name}</span>
                                  <Download className="w-[11px] h-[11px] text-[#475569] shrink-0 group-hover:text-[#00B2A9] transition-colors" />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {!isSearching && <div className="mt-[32px] mb-[24px] p-[20px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[16px]">
            <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[10px]">Brand Guidelines</div>
            <div className="grid grid-cols-2 gap-[16px] text-[12px] text-[#94A3B8] leading-[1.6]">
              <div>
                <div className="text-[11px] font-semibold text-white mb-[4px]">Logo Usage</div>
                <ul className="list-disc list-inside text-[11px] text-[#64748B] space-y-[2px]">
                  <li>Use Light version on dark backgrounds</li>
                  <li>Use Dark version on light backgrounds</li>
                  <li>Maintain clear space around the logo</li>
                  <li>Never distort, rotate, or recolor the logo</li>
                </ul>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-white mb-[4px]">Typography</div>
                <ul className="list-disc list-inside text-[11px] text-[#64748B] space-y-[2px]">
                  <li>Primary font: Poppins (all weights)</li>
                  <li>Headlines: Bold/Black, uppercase</li>
                  <li>Body: Regular/Medium</li>
                  <li>Tracking: tight for headlines, normal for body</li>
                </ul>
              </div>
            </div>
          </div>}

          {isSearching && filteredCategories.length === 0 && (
            <div className="text-center py-[60px]">
              <div className="text-[15px] text-[#475569] mb-[4px]">No assets found</div>
              <div className="text-[12px] text-[#334155]">Try a different search term</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
