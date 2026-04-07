import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutTemplate, MonitorPlay, Presentation, Bot, Check, X, type LucideIcon } from "lucide-react";
import { HIGHLY_POSES } from "./highlyData";

const BASE = import.meta.env.BASE_URL;
const bg = (name: string) => `${BASE}assets/backgrounds-dark/${name}`;
const bgLight = (name: string) => `${BASE}assets/backgrounds-light/${name}`;
const highly = (name: string) => `${BASE}assets/highly/${name}`;
const logo = (name: string) => `${BASE}assets/logos/${name}`;

interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  sizes: Size[];
}

interface Size {
  id: string;
  name: string;
  ratio: number;
}

interface Template {
  id: string;
  name: string;
  tag: string;
  categories: string[];
  bgType: "image" | "gradient";
  bgValue: string;
  textLayout: "center" | "top-left" | "bottom-left" | "minimal-center";
  textStyle: "bold" | "clean" | "futuristic" | "minimal";
  headline: string;
  subtext: string;
  overlay?: string;
  logoSrc?: string;
  mascotSrc?: string;
  mascotPosition?: string;
}

const CATEGORIES: Category[] = [
  {
    id: "social",
    name: "Social",
    icon: LayoutTemplate,
    sizes: [
      { id: "square", name: "Instagram Square (1080\u00d71080)", ratio: 1 },
      { id: "portrait", name: "Instagram Portrait (1080\u00d71350)", ratio: 1080/1350 },
      { id: "story", name: "Story / Reel (1080\u00d71920)", ratio: 1080/1920 },
      { id: "landscape", name: "Twitter / FB Landscape (1200\u00d7628)", ratio: 1200/628 }
    ]
  },
  {
    id: "ads",
    name: "Ads",
    icon: MonitorPlay,
    sizes: [
      { id: "leaderboard", name: "Leaderboard (728\u00d790)", ratio: 728/90 },
      { id: "med-rect", name: "Medium Rectangle (300\u00d7250)", ratio: 300/250 },
      { id: "wide-banner", name: "Wide Banner (1200\u00d7628)", ratio: 1200/628 },
      { id: "yt-thumb", name: "YouTube Thumbnail (1280\u00d7720)", ratio: 1280/720 }
    ]
  },
  {
    id: "presentation",
    name: "Presentation",
    icon: Presentation,
    sizes: [
      { id: "widescreen", name: "Widescreen (16:9)", ratio: 16/9 },
      { id: "standard", name: "Standard (4:3)", ratio: 4/3 },
      { id: "ultra", name: "Ultra Wide (21:9)", ratio: 21/9 },
      { id: "square", name: "Square (1:1)", ratio: 1 }
    ]
  }
];

const TEMPLATES: Template[] = [
  {
    id: "core-gradient",
    name: "Core Gradient",
    tag: "Brand Core",
    categories: ["social", "ads", "presentation"],
    bgType: "image",
    bgValue: bg("Type=Core Gradient.png"),
    textLayout: "center",
    textStyle: "bold",
    headline: "LAUNCH YOUR BRAND",
    subtext: "HighLevel",
  },
  {
    id: "planet-hero",
    name: "Planet Hero",
    tag: "Social",
    categories: ["social"],
    bgType: "image",
    bgValue: bg("Type=Centered Planet.png"),
    textLayout: "center",
    textStyle: "futuristic",
    headline: "BEYOND LIMITS",
    subtext: "Powered by HighLevel",
  },
  {
    id: "radial-shine",
    name: "Radial Shine",
    tag: "Event",
    categories: ["social", "ads"],
    bgType: "image",
    bgValue: bg("Type=Radial Shine Bottom Left.png"),
    textLayout: "top-left",
    textStyle: "clean",
    headline: "SUMMIT 2025",
    subtext: "Join the movement",
    logoSrc: logo("Lockup=Full Horizontal, Color=Light.png"),
  },
  {
    id: "planet-promo",
    name: "Planet Promo",
    tag: "Product",
    categories: ["social", "ads"],
    bgType: "image",
    bgValue: bg("Type=Planet Bottom Right.png"),
    textLayout: "top-left",
    textStyle: "bold",
    headline: "NEW FEATURE DROP",
    subtext: "Everything you need to grow",
  },
  {
    id: "horizon-light",
    name: "Horizon Light",
    tag: "Minimal",
    categories: ["presentation", "ads"],
    bgType: "image",
    bgValue: bgLight("Property 1=Centered Horizon.png"),
    textLayout: "center",
    textStyle: "minimal",
    headline: "Clean. Simple. Powerful.",
    subtext: "HighLevel",
    overlay: "rgba(0,0,0,0.15)",
  },
  {
    id: "highly-wave",
    name: "Highly Wave",
    tag: "Social",
    categories: ["social"],
    bgType: "gradient",
    bgValue: "linear-gradient(135deg, #095DC3 0%, #2896FB 50%, #00B2A9 100%)",
    textLayout: "bottom-left",
    textStyle: "bold",
    headline: "SAY HI TO HIGHLY",
    subtext: "Your new AI sidekick",
    mascotSrc: highly("Highly_Hi 1.png"),
    mascotPosition: "right",
  },
  {
    id: "deep-space",
    name: "Deep Space",
    tag: "Cinematic",
    categories: ["social", "presentation"],
    bgType: "image",
    bgValue: bg("Type=Large Planet Bottom Right.png"),
    textLayout: "minimal-center",
    textStyle: "futuristic",
    headline: "THINK BIGGER",
    subtext: "HighLevel Platform",
  },
  {
    id: "neutral-canvas",
    name: "Neutral Canvas",
    tag: "Minimal",
    categories: ["presentation", "ads"],
    bgType: "image",
    bgValue: bgLight("Property 1=Neutral.png"),
    textLayout: "center",
    textStyle: "minimal",
    headline: "Less noise. More growth.",
    subtext: "HighLevel",
    overlay: "rgba(0,0,0,0.1)",
  },
  {
    id: "ray-burst",
    name: "Ray Burst",
    tag: "Event",
    categories: ["social", "ads"],
    bgType: "image",
    bgValue: bg("Type=Planet Ray Bottom Right.png"),
    textLayout: "top-left",
    textStyle: "bold",
    headline: "LIVE EVENT",
    subtext: "Register now \u2022 Free access",
    logoSrc: logo("Lockup=Full Horizontal, Color=Light.png"),
  },
  {
    id: "teal-gradient",
    name: "Teal Flow",
    tag: "Brand Core",
    categories: ["social", "ads", "presentation"],
    bgType: "image",
    bgValue: bg("Type=Small Radial Shine Right.png"),
    textLayout: "center",
    textStyle: "clean",
    headline: "GROW WITH US",
    subtext: "HighLevel \u2022 All-in-one platform",
  },
  {
    id: "small-planet",
    name: "Orbit View",
    tag: "Product",
    categories: ["social"],
    bgType: "image",
    bgValue: bg("Type=Small Planet Bottom Right.png"),
    textLayout: "bottom-left",
    textStyle: "futuristic",
    headline: "AUTOMATION ENGINE",
    subtext: "Built for scale",
  },
  {
    id: "highly-fly",
    name: "Highly Launch",
    tag: "Social",
    categories: ["social", "ads"],
    bgType: "gradient",
    bgValue: "linear-gradient(160deg, #030B17 0%, #07223D 40%, #0A3366 70%, #07223D 100%)",
    textLayout: "bottom-left",
    textStyle: "bold",
    headline: "TAKING OFF",
    subtext: "New heights with HighLevel",
    mascotSrc: highly("Highly_Flying 1.png"),
    mascotPosition: "right",
  },
];

const TEXT_LAYOUTS: Record<string, { container: string; headlineClass: string; subtextClass: string }> = {
  "center": {
    container: "absolute inset-0 flex flex-col items-center justify-center p-[10%] text-center z-[3]",
    headlineClass: "font-['Poppins'] font-black uppercase leading-[0.95] drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)]",
    subtextClass: "font-['Poppins'] font-semibold uppercase tracking-[2.5px] mt-[6px] drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]",
  },
  "top-left": {
    container: "absolute inset-0 flex flex-col items-start justify-start p-[8%] text-left z-[3]",
    headlineClass: "font-['Poppins'] font-black uppercase leading-[0.95] drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]",
    subtextClass: "font-['Poppins'] font-medium tracking-[1px] mt-[6px] drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]",
  },
  "bottom-left": {
    container: "absolute inset-0 flex flex-col items-start justify-end p-[8%] text-left z-[3]",
    headlineClass: "font-['Poppins'] font-black uppercase leading-[0.95] drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]",
    subtextClass: "font-['Poppins'] font-medium tracking-[1px] mt-[6px] drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]",
  },
  "minimal-center": {
    container: "absolute inset-0 flex flex-col items-center justify-center p-[10%] text-center z-[3]",
    headlineClass: "font-['Poppins'] font-bold tracking-[4px] uppercase leading-[1.2] drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)]",
    subtextClass: "font-['Poppins'] font-normal tracking-[2px] mt-[8px] drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]",
  },
};

const TEXT_STYLES: Record<string, { headlineSize: string; subtextSize: string; headlineColor: string; subtextColor: string }> = {
  "bold": {
    headlineSize: "text-[clamp(14px,3vw,36px)]",
    subtextSize: "text-[clamp(7px,1.2vw,13px)]",
    headlineColor: "text-white",
    subtextColor: "text-[rgba(255,255,255,0.5)]",
  },
  "clean": {
    headlineSize: "text-[clamp(13px,2.5vw,30px)]",
    subtextSize: "text-[clamp(7px,1vw,12px)]",
    headlineColor: "text-white",
    subtextColor: "text-[rgba(255,255,255,0.45)]",
  },
  "futuristic": {
    headlineSize: "text-[clamp(16px,3.5vw,40px)]",
    subtextSize: "text-[clamp(7px,1vw,11px)]",
    headlineColor: "text-[#20EDF1]",
    subtextColor: "text-[rgba(255,255,255,0.4)]",
  },
  "minimal": {
    headlineSize: "text-[clamp(12px,2vw,24px)]",
    subtextSize: "text-[clamp(7px,1vw,12px)]",
    headlineColor: "text-[#1A1A2E]",
    subtextColor: "text-[rgba(0,0,0,0.4)]",
  },
};

export function TemplatesWorkspace() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [activeSize, setActiveSize] = useState(CATEGORIES[0].sizes[0]);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [selectedHighly, setSelectedHighly] = useState<string | null>(null);

  const activeHighly = HIGHLY_POSES.find(h => h.id === selectedHighly);

  const handleCategoryChange = (cat: Category) => {
    setActiveCategory(cat);
    setActiveSize(cat.sizes[0]);
  };

  const handleTemplateSelect = (tpl: Template) => {
    setActiveTemplate(tpl);
    if (!headline) setHeadline(tpl.headline);
    if (!subtext) setSubtext(tpl.subtext);
  };

  const filtered = TEMPLATES.filter(t => t.categories.includes(activeCategory.id));

  const renderPreviewContent = (tpl: Template, headlineText: string, subtextText: string, isCard: boolean) => {
    const layout = TEXT_LAYOUTS[tpl.textLayout];
    const style = TEXT_STYLES[tpl.textStyle];

    return (
      <>
        {tpl.bgType === "image" ? (
          <img src={tpl.bgValue} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
        ) : (
          <div className="absolute inset-0 z-0" style={{ background: tpl.bgValue }} />
        )}

        {tpl.overlay && (
          <div className="absolute inset-0 z-[1]" style={{ backgroundColor: tpl.overlay }} />
        )}

        {((!isCard && activeHighly) || tpl.mascotSrc) && (
          <img
            src={!isCard && activeHighly ? activeHighly.image : tpl.mascotSrc!}
            alt=""
            className={`absolute z-[2] object-contain pointer-events-none ${
              tpl.mascotPosition === "right" || !tpl.mascotPosition
                ? isCard ? "bottom-0 right-[4%] h-[65%]" : "bottom-0 right-[5%] h-[70%]"
                : "bottom-0 left-[5%] h-[70%]"
            }`}
          />
        )}

        {tpl.logoSrc && (
          <img
            src={tpl.logoSrc}
            alt="HighLevel"
            className={`absolute z-[4] object-contain pointer-events-none ${
              isCard ? "bottom-[8%] right-[6%] h-[10%] max-h-[16px] opacity-60" : "bottom-[6%] right-[5%] h-[6%] max-h-[28px] opacity-50"
            }`}
          />
        )}

        <div className={layout.container}>
          <div className={`${layout.headlineClass} ${isCard ? 'text-[clamp(7px,1.4vw,13px)]' : style.headlineSize} ${style.headlineColor}`}>
            {headlineText}
          </div>
          <div className={`${layout.subtextClass} ${isCard ? 'text-[clamp(5px,0.7vw,8px)]' : style.subtextSize} ${style.subtextColor}`}>
            {subtextText}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-1 overflow-hidden p-0 gap-0">

      <div className="w-[400px] min-w-[400px] overflow-y-auto overflow-x-hidden py-[16px] px-[24px] pb-[28px] border-r border-[rgba(255,255,255,0.04)] flex flex-col">
        <div className="text-[14px] font-bold text-white mb-[1px]">Create something new</div>
        <div className="text-[11.5px] text-[#475569] mb-[16px]">Pick a format, size, then a template.</div>

        <div className="flex gap-[8px] mb-[16px]">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory.id === cat.id;
            return (
              <motion.div
                key={cat.id}
                onClick={() => handleCategoryChange(cat)}
                whileHover={{ y: isActive ? 0 : -2 }}
                whileTap={{ scale: 0.97 }}
                className={`flex-1 flex flex-col items-center gap-[8px] pt-[14px] px-[8px] pb-[12px] bg-[rgba(255,255,255,0.015)] border rounded-[12px] cursor-pointer transition-all duration-300 relative overflow-hidden
                  ${isActive
                    ? 'border-[rgba(0,178,169,0.25)] bg-[rgba(255,255,255,0.025)] shadow-[0_6px_24px_rgba(0,0,0,0.2)]'
                    : 'border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.07)]'
                  }`}
              >
                {isActive && <div className="absolute bottom-0 left-[20%] right-[20%] h-[2px] bg-[#00B2A9]" />}
                <div className={`w-[36px] h-[36px] rounded-[10px] border flex items-center justify-center transition-all
                  ${isActive ? 'bg-[rgba(0,178,169,0.1)] border-[rgba(0,178,169,0.2)]' : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.04)]'}`}>
                  <Icon className={`w-[16px] h-[16px] ${isActive ? 'text-[#00B2A9]' : 'text-[#64748B]'}`} />
                </div>
                <div className={`text-[11px] font-semibold ${isActive ? 'text-white' : 'text-[#64748B]'}`}>{cat.name}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="mb-[14px]">
          <select
            value={activeSize.id}
            onChange={(e) => setActiveSize(activeCategory.sizes.find(s => s.id === e.target.value) || activeCategory.sizes[0])}
            className="w-full py-[10px] pr-[38px] pl-[14px] bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[10px] font-inherit text-[12px] font-medium text-white cursor-pointer outline-none appearance-none focus:border-[rgba(0,178,169,0.3)] bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2212%22_height=%2212%22_viewBox=%220_0_24_24%22_fill=%22none%22_stroke=%22rgba(255,255,255,0.3)%22_stroke-width=%222%22%3E%3Cpolyline_points=%226_9_12_15_18_9%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_14px_center]"
          >
            {activeCategory.sizes.map(size => (
              <option key={size.id} value={size.id} className="bg-[#0a1628] text-white">{size.name}</option>
            ))}
          </select>
        </div>

        <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[10px]">Choose a style</div>

        <div className="grid grid-cols-2 gap-[10px] pb-[4px]">
          <AnimatePresence mode="popLayout">
            {filtered.map((tpl, i) => {
              const isActive = activeTemplate?.id === tpl.id;
              return (
                <motion.div
                  key={tpl.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, duration: 0.35, ease: "easeOut" }}
                  onClick={() => handleTemplateSelect(tpl)}
                  whileHover={{ y: isActive ? 0 : -4, scale: isActive ? 1 : 1.03 }}
                  className={`rounded-[12px] overflow-hidden bg-[rgba(255,255,255,0.015)] border cursor-pointer transition-shadow duration-300 relative
                    ${isActive
                      ? 'border-[rgba(0,178,169,0.35)] shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_24px_rgba(0,178,169,0.12)]'
                      : 'border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.08)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]'}`}
                >
                  <div
                    className="w-full max-h-[180px] relative overflow-hidden"
                    style={{ aspectRatio: activeSize.ratio }}
                  >
                    {renderPreviewContent(tpl, tpl.headline, tpl.subtext, true)}
                  </div>
                  <div className="py-[8px] px-[10px] flex items-center justify-between bg-[rgba(255,255,255,0.02)]">
                    <div className={`text-[10px] font-semibold ${isActive ? 'text-[rgba(0,178,169,0.8)]' : 'text-[#7B8BA5]'}`}>{tpl.name}</div>
                    <div className="text-[9px] text-[#475569] bg-[rgba(255,255,255,0.03)] px-[6px] py-[2px] rounded-[4px]">{tpl.tag}</div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {activeTemplate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-[12px] mt-[16px] pt-[16px] border-t border-[rgba(255,255,255,0.04)]"
          >
            <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[4px]">Text</div>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[#64748B]">Headline</label>
              <input
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder="Enter bold headline..."
                maxLength={60}
                className="w-full py-[12px] px-[14px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[10px] text-white font-inherit text-[15px] font-bold outline-none focus:border-[rgba(0,178,169,0.3)] placeholder:text-[#475569]"
              />
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[#64748B]">Subtext</label>
              <input
                type="text"
                value={subtext}
                onChange={e => setSubtext(e.target.value)}
                placeholder="Supporting text..."
                maxLength={40}
                className="w-full py-[10px] px-[14px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[10px] text-white font-inherit text-[13px] font-medium outline-none focus:border-[rgba(0,178,169,0.3)] placeholder:text-[#475569]"
              />
            </div>
          </motion.div>
        )}

        {activeTemplate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-[10px] mt-[16px] pt-[16px] border-t border-[rgba(255,255,255,0.04)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[6px]">
                <Bot className="w-[12px] h-[12px] text-[#00B2A9]" />
                <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569]">Highly Mascot</span>
              </div>
              {selectedHighly && (
                <motion.button
                  onClick={() => setSelectedHighly(null)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-[9px] text-[#5A6B80] hover:text-[#FF6B6B] cursor-pointer transition-colors flex items-center gap-[3px]"
                >
                  <X className="w-[9px] h-[9px]" />
                  Remove
                </motion.button>
              )}
            </div>
            <div className="grid grid-cols-5 gap-[6px]">
              {HIGHLY_POSES.map((pose) => (
                <motion.button
                  key={pose.id}
                  onClick={() => setSelectedHighly(selectedHighly === pose.id ? null : pose.id)}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative aspect-square rounded-[10px] border overflow-hidden cursor-pointer transition-all duration-200 group
                    ${selectedHighly === pose.id
                      ? 'border-[#00B2A9] bg-[rgba(0,178,169,0.1)] ring-[2px] ring-[#00B2A9] ring-offset-[2px] ring-offset-[#0A1628]'
                      : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(0,178,169,0.2)] hover:bg-[rgba(0,178,169,0.04)]'
                    }`}
                  title={pose.name}
                >
                  <img src={pose.image} alt={pose.name} className="w-full h-full object-contain p-[3px]" />
                  {selectedHighly === pose.id && (
                    <div className="absolute top-[1px] right-[1px] w-[12px] h-[12px] rounded-full bg-[#00B2A9] flex items-center justify-center">
                      <Check className="w-[7px] h-[7px] text-white" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-[rgba(0,0,0,0.75)] py-[1px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-[6px] text-white text-center truncate px-[2px]">{pose.name}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0 py-[20px] px-[24px] pb-[24px]">
        <div className="flex items-center justify-between pb-[14px]">
          <div className="text-[13px] font-medium text-[#64748B] flex items-center gap-[9px]">
            <div className="w-[8px] h-[8px] rounded-full bg-[#00B2A9] shadow-[0_0_10px_rgba(0,178,169,0.4)] animate-[pulse-dot_2s_infinite]" />
            Live Preview
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center relative overflow-hidden rounded-[16px]">
          <AnimatePresence mode="wait">
            {activeTemplate ? (
              <motion.div
                key={activeTemplate.id}
                data-export-preview
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative w-full max-w-[680px] mx-auto rounded-[14px] overflow-hidden z-[2]"
                style={{
                  aspectRatio: activeSize.ratio,
                  boxShadow: '0 8px 50px rgba(0,0,0,0.3)',
                }}
              >
                <div className="absolute top-[12px] right-[12px] py-[4px] px-[10px] bg-[rgba(0,0,0,0.5)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.08)] rounded-[6px] text-[9px] font-semibold text-[rgba(255,255,255,0.5)] z-[10] pointer-events-none">
                  {activeSize.ratio > 1 ? `${Math.round(activeSize.ratio * 1080)}\u00d71080` : `1080\u00d7${Math.round(1080 / activeSize.ratio)}`}
                </div>
                {renderPreviewContent(
                  activeTemplate,
                  headline || activeTemplate.headline,
                  subtext || activeTemplate.subtext,
                  false
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative w-full max-w-[680px] mx-auto rounded-[14px] overflow-hidden bg-[rgba(255,255,255,0.01)] z-[2]"
                style={{ aspectRatio: activeSize.ratio }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center z-[2]">
                  <div className="w-[64px] h-[64px] rounded-[20px] bg-gradient-to-br from-[rgba(0,178,169,0.08)] to-[rgba(9,93,195,0.08)] border border-[rgba(0,178,169,0.1)] flex items-center justify-center mb-[20px]">
                    <LayoutTemplate className="w-[28px] h-[28px] text-[rgba(0,178,169,0.5)]" />
                  </div>
                  <div className="text-[16px] font-bold text-white mb-[6px]">Start creating</div>
                  <div className="text-[12.5px] text-[#64748B] mb-[24px] text-center leading-[1.5]">
                    Select a format and template to build<br/>beautiful HighLevel assets in seconds
                  </div>
                  <button
                    onClick={() => handleTemplateSelect(filtered[0])}
                    className="py-[10px] px-[24px] bg-gradient-to-br from-[rgba(0,178,169,0.12)] to-[rgba(0,178,169,0.06)] border border-[rgba(0,178,169,0.2)] rounded-[10px] font-inherit text-[12px] font-semibold text-[#00B2A9] cursor-pointer mb-[40px] hover:bg-[rgba(0,178,169,0.1)] transition-all duration-200"
                  >
                    Choose a Template
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
