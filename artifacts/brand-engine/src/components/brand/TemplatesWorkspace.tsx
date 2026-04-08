import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutTemplate, MonitorPlay, Presentation, Mail, Bot, Check, X, Upload, Image as ImageIcon, Move, AlignCenter, AlignLeft, AlignRight, ArrowUp, ArrowDown, Minus, Type, Palette, Bold, Eraser, Loader2, RotateCcw, Hand, type LucideIcon } from "lucide-react";
import { HIGHLY_POSES } from "./highlyData";

const BASE = import.meta.env.BASE_URL;
const bg = (name: string) => `${BASE}assets/backgrounds-dark/${name}`;
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
  bgHasLogo?: boolean;
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
  },
  {
    id: "email",
    name: "Email",
    icon: Mail,
    sizes: [
      { id: "email-header", name: "Email Header (600×200)", ratio: 600/200 },
      { id: "email-banner", name: "Email Banner (600×300)", ratio: 600/300 },
      { id: "email-hero", name: "Email Hero (600×400)", ratio: 600/400 },
      { id: "email-square", name: "Email Square (600×600)", ratio: 1 }
    ]
  }
];

const TEMPLATES: Template[] = [
  {
    id: "core-gradient",
    name: "Core Gradient",
    tag: "Brand Core",
    categories: ["social", "ads", "presentation", "email"],
    bgType: "image",
    bgValue: bg("Type=Core Gradient.png"),
    textLayout: "center",
    textStyle: "bold",
    headline: "LAUNCH YOUR BRAND",
    subtext: "HighLevel",
    bgHasLogo: true,
  },
  {
    id: "planet-hero",
    name: "Planet Hero",
    tag: "Cinematic",
    categories: ["social", "ads", "presentation", "email"],
    bgType: "image",
    bgValue: bg("Type=Centered Planet.png"),
    textLayout: "center",
    textStyle: "futuristic",
    headline: "BEYOND LIMITS",
    subtext: "Powered by HighLevel",
    bgHasLogo: true,
  },
];

const ALIGN_MAP: Record<string, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};

const VPOS_MAP: Record<string, string> = {
  top: "justify-start",
  middle: "justify-center",
  bottom: "justify-end",
};

function buildLayout(align: string, vpos: string) {
  return {
    container: `absolute inset-0 flex flex-col ${ALIGN_MAP[align] || ALIGN_MAP.center} ${VPOS_MAP[vpos] || VPOS_MAP.middle} p-[8%] z-[3]`,
    headlineClass: "font-['Poppins'] font-black uppercase leading-[0.95] drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)]",
    subtextClass: "font-['Poppins'] font-semibold uppercase tracking-[2.5px] mt-[6px] drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]",
  };
}

const TEXT_LAYOUTS: Record<string, { container: string; headlineClass: string; subtextClass: string }> = {
  "top-left": buildLayout("left", "top"),
  "top-center": buildLayout("center", "top"),
  "top-right": buildLayout("right", "top"),
  "middle-left": buildLayout("left", "middle"),
  "center": buildLayout("center", "middle"),
  "middle-right": buildLayout("right", "middle"),
  "bottom-left": buildLayout("left", "bottom"),
  "bottom-center": buildLayout("center", "bottom"),
  "bottom-right": buildLayout("right", "bottom"),
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

const ALIGN_OPTIONS = [
  { id: "left", label: "Left", Icon: AlignLeft },
  { id: "center", label: "Center", Icon: AlignCenter },
  { id: "right", label: "Right", Icon: AlignRight },
] as const;

const VPOS_OPTIONS = [
  { id: "top", label: "Top", Icon: ArrowUp },
  { id: "middle", label: "Middle", Icon: Minus },
  { id: "bottom", label: "Bottom", Icon: ArrowDown },
] as const;

const STYLE_OPTIONS = [
  { id: "bold", label: "Bold" },
  { id: "clean", label: "Clean" },
  { id: "futuristic", label: "Neon" },
  { id: "minimal", label: "Minimal" },
] as const;

const COLOR_OPTIONS = [
  { id: null, label: "Default", color: "bg-gradient-to-r from-white to-[#20EDF1]" },
  { id: "text-white", label: "White", color: "bg-white" },
  { id: "text-[#20EDF1]", label: "Teal", color: "bg-[#20EDF1]" },
  { id: "text-[#2896FB]", label: "Blue", color: "bg-[#2896FB]" },
  { id: "text-[#00B2A9]", label: "Brand", color: "bg-[#00B2A9]" },
  { id: "text-[#FFD700]", label: "Gold", color: "bg-[#FFD700]" },
] as const;

export function TemplatesWorkspace() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [activeSize, setActiveSize] = useState(CATEGORIES[0].sizes[0]);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [selectedHighly, setSelectedHighly] = useState<string | null>(null);
  const [textAlign, setTextAlign] = useState<string | null>(null);
  const [textVpos, setTextVpos] = useState<string | null>(null);
  const [textStyle, setTextStyle] = useState<string | null>(null);
  const [headlineColor, setHeadlineColor] = useState<string | null>(null);
  const [mascotPos, setMascotPos] = useState({ x: 65, y: 30 });
  const [mascotScale, setMascotScale] = useState(60);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [photoPos, setPhotoPos] = useState({ x: 50, y: 50 });
  const [photoScale, setPhotoScale] = useState(40);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState<"mascot" | "photo" | "text" | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [activeToolbar, setActiveToolbar] = useState<"text" | "position" | "style" | "color" | null>(null);
  const [textPos, setTextPos] = useState({ x: 50, y: 50 });
  const [textFreeMode, setTextFreeMode] = useState(false);
  const [snapGuides, setSnapGuides] = useState<{ h: number[]; v: number[] }>({ h: [], v: [] });
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgRemoved, setBgRemoved] = useState(false);

  const activeHighly = HIGHLY_POSES.find(h => h.id === selectedHighly);

  const handleRemoveBackground = async () => {
    if (!uploadedPhoto || isRemovingBg) return;
    setIsRemovingBg(true);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(uploadedPhoto, {
        progress: () => {},
      });
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedPhoto(ev.target?.result as string);
        setBgRemoved(true);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Background removal failed:", err);
    } finally {
      setIsRemovingBg(false);
    }
  };

  useEffect(() => {
    return () => { cleanupRef.current?.(); };
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedPhoto(ev.target?.result as string);
      setBgRemoved(false);
    };
    reader.readAsDataURL(file);
  };

  const SNAP_THRESHOLD = 2;
  const SNAP_LINES = {
    v: [4, 8, 50, 92, 96],
    h: [4, 8, 50, 92, 96],
  };

  const snapValue = (val: number, lines: number[]) => {
    const guides: number[] = [];
    let snapped = val;
    for (const line of lines) {
      if (Math.abs(val - line) <= SNAP_THRESHOLD) {
        snapped = line;
        guides.push(line);
      }
    }
    return { snapped, guides };
  };

  const handleDragStart = useCallback((type: "mascot" | "photo" | "text", e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(type);

    const preview = previewRef.current;
    if (!preview) return;
    const rect = preview.getBoundingClientRect();

    const getClientPos = (ev: MouseEvent | TouchEvent) => {
      if ('touches' in ev) return { cx: ev.touches[0].clientX, cy: ev.touches[0].clientY };
      return { cx: (ev as MouseEvent).clientX, cy: (ev as MouseEvent).clientY };
    };

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const { cx, cy } = getClientPos(ev);
      const rawX = Math.max(0, Math.min(100, ((cx - rect.left) / rect.width) * 100));
      const rawY = Math.max(0, Math.min(100, ((cy - rect.top) / rect.height) * 100));

      if (type === "text") {
        const sx = snapValue(rawX, SNAP_LINES.v);
        const sy = snapValue(rawY, SNAP_LINES.h);
        setTextPos({ x: sx.snapped, y: sy.snapped });
        setSnapGuides({ v: sx.guides, h: sy.guides });
      } else if (type === "mascot") {
        setMascotPos({ x: rawX, y: rawY });
      } else {
        setPhotoPos({ x: rawX, y: rawY });
      }
    };

    const cleanup = () => {
      setDragging(null);
      setSnapGuides({ h: [], v: [] });
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
      cleanupRef.current = null;
    };

    const onUp = () => cleanup();

    cleanupRef.current = cleanup;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
  }, []);

  const handleCategoryChange = (cat: Category) => {
    setActiveCategory(cat);
    setActiveSize(cat.sizes[0]);
  };

  const handleTemplateSelect = (tpl: Template) => {
    setActiveTemplate(tpl);
    setHeadline(tpl.headline);
    setSubtext(tpl.subtext);
    setTextAlign(null);
    setTextVpos(null);
    setTextStyle(null);
    setHeadlineColor(null);
    setActiveToolbar(null);
  };

  const filtered = TEMPLATES.filter(t => t.categories.includes(activeCategory.id));

  const LOGO_LIGHT = logo("Lockup=Full Horizontal, Color=Light.png");

  const getEffectiveLayoutKey = (tpl: Template, isCard: boolean) => {
    if (isCard) return tpl.textLayout;
    const defaultAlign = tpl.textLayout.includes("left") ? "left" : tpl.textLayout.includes("right") ? "right" : "center";
    const defaultVpos = tpl.textLayout.startsWith("top") ? "top" : tpl.textLayout.startsWith("bottom") ? "bottom" : "middle";
    const align = textAlign || defaultAlign;
    const vpos = textVpos || defaultVpos;
    if (align === "center" && vpos === "middle") return "center";
    return `${vpos}-${align}`;
  };

  const renderPreviewContent = (tpl: Template, headlineText: string, subtextText: string, isCard: boolean) => {
    const effectiveLayoutKey = getEffectiveLayoutKey(tpl, isCard);
    const effectiveStyle = isCard ? tpl.textStyle : (textStyle || tpl.textStyle);
    const layout = TEXT_LAYOUTS[effectiveLayoutKey] || TEXT_LAYOUTS["center"];
    const style = TEXT_STYLES[effectiveStyle];
    const effectiveHeadlineColor = !isCard && headlineColor ? headlineColor : style.headlineColor;
    const showDraggableMascot = !isCard && activeHighly;
    const showDraggablePhoto = !isCard && uploadedPhoto;

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

        {!isCard && textFreeMode ? (
          <div
            className="absolute z-[3] cursor-move select-none"
            style={{
              left: `${textPos.x}%`,
              top: `${textPos.y}%`,
              transform: "translate(-50%, -50%)",
              maxWidth: "80%",
            }}
            onMouseDown={(e) => handleDragStart("text", e)}
            onTouchStart={(e) => handleDragStart("text", e)}
          >
            <div className={`${layout.headlineClass} ${style.headlineSize} ${effectiveHeadlineColor} ${textAlign === "right" ? "text-right" : textAlign === "left" ? "text-left" : "text-center"}`}>
              {headlineText}
            </div>
            <div className={`${layout.subtextClass} ${style.subtextSize} ${style.subtextColor} ${textAlign === "right" ? "text-right" : textAlign === "left" ? "text-left" : "text-center"}`}>
              {subtextText}
            </div>
          </div>
        ) : (
          <div className={`${layout.container} pointer-events-none`}
          >
            <div className={`${layout.headlineClass} ${isCard ? 'text-[clamp(7px,1.4vw,13px)]' : style.headlineSize} ${effectiveHeadlineColor}`}>
              {headlineText}
            </div>
            <div className={`${layout.subtextClass} ${isCard ? 'text-[clamp(5px,0.7vw,8px)]' : style.subtextSize} ${style.subtextColor}`}>
              {subtextText}
            </div>
          </div>
        )}

        {!isCard && dragging === "text" && (
          <>
            {snapGuides.v.map((g) => (
              <div key={`sv-${g}`} className="absolute top-0 bottom-0 z-[20] pointer-events-none" style={{ left: `${g}%`, width: "1px", background: "#FF3366", boxShadow: "0 0 4px #FF3366" }} />
            ))}
            {snapGuides.h.map((g) => (
              <div key={`sh-${g}`} className="absolute left-0 right-0 z-[20] pointer-events-none" style={{ top: `${g}%`, height: "1px", background: "#FF3366", boxShadow: "0 0 4px #FF3366" }} />
            ))}
            <div className="absolute top-0 bottom-0 z-[19] pointer-events-none opacity-20" style={{ left: "50%", width: "1px", background: "#FF3366" }} />
            <div className="absolute left-0 right-0 z-[19] pointer-events-none opacity-20" style={{ top: "50%", height: "1px", background: "#FF3366" }} />
            <div className="absolute top-0 bottom-0 z-[19] pointer-events-none opacity-10" style={{ left: "4%", width: "1px", background: "#FF3366" }} />
            <div className="absolute top-0 bottom-0 z-[19] pointer-events-none opacity-10" style={{ left: "96%", width: "1px", background: "#FF3366" }} />
            <div className="absolute left-0 right-0 z-[19] pointer-events-none opacity-10" style={{ top: "4%", height: "1px", background: "#FF3366" }} />
            <div className="absolute left-0 right-0 z-[19] pointer-events-none opacity-10" style={{ top: "96%", height: "1px", background: "#FF3366" }} />
            <div className="absolute top-0 bottom-0 z-[19] pointer-events-none opacity-10" style={{ left: "8%", width: "1px", background: "#FF3366" }} />
            <div className="absolute top-0 bottom-0 z-[19] pointer-events-none opacity-10" style={{ left: "92%", width: "1px", background: "#FF3366" }} />
            <div className="absolute left-0 right-0 z-[19] pointer-events-none opacity-10" style={{ top: "8%", height: "1px", background: "#FF3366" }} />
            <div className="absolute left-0 right-0 z-[19] pointer-events-none opacity-10" style={{ top: "92%", height: "1px", background: "#FF3366" }} />
          </>
        )}

        {showDraggablePhoto && (
          <img
            src={uploadedPhoto!}
            alt="Uploaded"
            className="absolute z-[6] object-contain cursor-move select-none"
            style={{
              left: `${photoPos.x}%`,
              top: `${photoPos.y}%`,
              transform: "translate(-50%, -50%)",
              height: `${photoScale}%`,
              maxWidth: "90%",
            }}
            onMouseDown={(e) => handleDragStart("photo", e)}
            onTouchStart={(e) => handleDragStart("photo", e)}
            draggable={false}
          />
        )}

        {showDraggableMascot && (
          <img
            src={activeHighly.image}
            alt={activeHighly.name}
            className="absolute z-[7] object-contain cursor-move select-none"
            style={{
              left: `${mascotPos.x}%`,
              top: `${mascotPos.y}%`,
              transform: "translate(-50%, -50%)",
              height: `${mascotScale}%`,
            }}
            onMouseDown={(e) => handleDragStart("mascot", e)}
            onTouchStart={(e) => handleDragStart("mascot", e)}
            draggable={false}
          />
        )}

        {!isCard && !tpl.bgHasLogo && (
          <img
            src={LOGO_LIGHT}
            alt="HighLevel"
            className="absolute z-[8] object-contain pointer-events-none top-[4%] left-[4%] h-[5%] max-h-[24px] opacity-80"
          />
        )}
      </>
    );
  };

  const defaultAlign = activeTemplate?.textLayout.includes("left") ? "left" : activeTemplate?.textLayout.includes("right") ? "right" : "center";
  const defaultVpos = activeTemplate?.textLayout.startsWith("top") ? "top" : activeTemplate?.textLayout.startsWith("bottom") ? "bottom" : "middle";
  const effectiveAlign = textAlign || defaultAlign;
  const effectiveVpos = textVpos || defaultVpos;
  const effectiveStyle = textStyle || activeTemplate?.textStyle || "bold";

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden p-0 gap-0">

      <div className="w-full md:w-[340px] md:min-w-[340px] overflow-y-auto overflow-x-hidden py-[16px] px-[16px] md:px-[20px] pb-[28px] border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.04)] flex flex-col max-h-[50vh] md:max-h-none">
        <div className="text-[14px] font-bold text-white mb-[1px]">Create something new</div>
        <div className="text-[11.5px] text-[#475569] mb-[16px]">Pick a format, size, then a template.</div>

        <div className="flex gap-[8px] mb-[16px] overflow-x-auto sidebar-scroll">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory.id === cat.id;
            return (
              <motion.div
                key={cat.id}
                onClick={() => handleCategoryChange(cat)}
                whileHover={{ y: isActive ? 0 : -2 }}
                whileTap={{ scale: 0.97 }}
                className={`flex-1 min-w-[70px] flex flex-col items-center gap-[8px] pt-[14px] px-[8px] pb-[12px] bg-[rgba(255,255,255,0.015)] border rounded-[12px] cursor-pointer transition-all duration-300 relative overflow-hidden
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

            {selectedHighly && (
              <div className="flex flex-col gap-[4px] mt-[4px]">
                <div className="flex items-center gap-[4px]">
                  <Move className="w-[10px] h-[10px] text-[#64748B]" />
                  <span className="text-[9px] text-[#64748B]">Drag on preview to move</span>
                </div>
                <div className="flex items-center gap-[8px]">
                  <span className="text-[9px] text-[#64748B] w-[28px]">Size</span>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={mascotScale}
                    onChange={(e) => setMascotScale(Number(e.target.value))}
                    className="flex-1 h-[3px] appearance-none bg-[rgba(255,255,255,0.08)] rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00B2A9] [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <span className="text-[9px] text-[#64748B] w-[24px] text-right">{mascotScale}%</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTemplate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col gap-[10px] mt-[16px] pt-[16px] border-t border-[rgba(255,255,255,0.04)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[6px]">
                <ImageIcon className="w-[12px] h-[12px] text-[#2896FB]" />
                <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569]">Your Photo</span>
              </div>
              {uploadedPhoto && (
                <motion.button
                  onClick={() => { setUploadedPhoto(null); setBgRemoved(false); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-[9px] text-[#5A6B80] hover:text-[#FF6B6B] cursor-pointer transition-colors flex items-center gap-[3px]"
                >
                  <X className="w-[9px] h-[9px]" />
                  Remove
                </motion.button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {uploadedPhoto ? (
              <div className="flex flex-col gap-[6px]">
                <div className="relative w-full h-[60px] rounded-[8px] overflow-hidden border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
                  <img src={uploadedPhoto} alt="Uploaded" className="w-full h-full object-contain" />
                </div>
                <div className="flex items-center gap-[4px]">
                  <Move className="w-[10px] h-[10px] text-[#64748B]" />
                  <span className="text-[9px] text-[#64748B]">Drag on preview to move</span>
                </div>
                <div className="flex items-center gap-[8px]">
                  <span className="text-[9px] text-[#64748B] w-[28px]">Size</span>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={photoScale}
                    onChange={(e) => setPhotoScale(Number(e.target.value))}
                    className="flex-1 h-[3px] appearance-none bg-[rgba(255,255,255,0.08)] rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2896FB] [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <span className="text-[9px] text-[#64748B] w-[24px] text-right">{photoScale}%</span>
                </div>
                <div className="flex gap-[6px]">
                  <motion.button
                    onClick={() => fileInputRef.current?.click()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-[7px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[8px] text-[10px] font-medium text-[#64748B] cursor-pointer hover:border-[rgba(40,150,251,0.2)] hover:text-[#2896FB] transition-all"
                  >
                    Change Photo
                  </motion.button>
                  <motion.button
                    onClick={handleRemoveBackground}
                    disabled={isRemovingBg || bgRemoved}
                    whileHover={{ scale: isRemovingBg || bgRemoved ? 1 : 1.02 }}
                    whileTap={{ scale: isRemovingBg || bgRemoved ? 1 : 0.98 }}
                    className={`flex-1 py-[7px] flex items-center justify-center gap-[5px] rounded-[8px] text-[10px] font-medium cursor-pointer transition-all border
                      ${bgRemoved
                        ? 'bg-[rgba(0,178,169,0.08)] border-[rgba(0,178,169,0.2)] text-[#00B2A9] cursor-default'
                        : isRemovingBg
                          ? 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#64748B] cursor-wait'
                          : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:border-[rgba(0,178,169,0.25)] hover:text-[#00B2A9] hover:bg-[rgba(0,178,169,0.04)]'
                      }`}
                  >
                    {isRemovingBg ? (
                      <>
                        <Loader2 className="w-[10px] h-[10px] animate-spin" />
                        Removing...
                      </>
                    ) : bgRemoved ? (
                      <>
                        <Check className="w-[10px] h-[10px]" />
                        BG Removed
                      </>
                    ) : (
                      <>
                        <Eraser className="w-[10px] h-[10px]" />
                        Remove BG
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            ) : (
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-[14px] flex flex-col items-center gap-[6px] bg-[rgba(255,255,255,0.02)] border border-dashed border-[rgba(255,255,255,0.08)] rounded-[10px] cursor-pointer hover:border-[rgba(40,150,251,0.25)] hover:bg-[rgba(40,150,251,0.03)] transition-all"
              >
                <Upload className="w-[16px] h-[16px] text-[#475569]" />
                <span className="text-[10px] text-[#475569]">Upload a photo or logo</span>
              </motion.button>
            )}
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
                ref={previewRef}
                key={activeTemplate.id}
                data-export-preview
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`relative w-full max-w-[680px] mx-auto rounded-[14px] overflow-hidden z-[2] ${dragging ? 'cursor-grabbing' : ''}`}
                style={{
                  aspectRatio: activeSize.ratio,
                  boxShadow: '0 8px 50px rgba(0,0,0,0.3)',
                }}
              >
                {renderPreviewContent(
                  activeTemplate,
                  headline || activeTemplate.headline,
                  subtext || activeTemplate.subtext,
                  false
                )}

                <div className="absolute bottom-[12px] left-1/2 -translate-x-1/2 z-[20] flex items-center gap-[3px] py-[6px] px-[8px] bg-[rgba(0,0,0,0.7)] backdrop-blur-[16px] border border-[rgba(255,255,255,0.1)] rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                  {([
                    { id: "text" as const, Icon: Type, label: "Text" },
                    { id: "position" as const, Icon: Move, label: "Position" },
                    { id: "style" as const, Icon: Bold, label: "Style" },
                    { id: "color" as const, Icon: Palette, label: "Color" },
                  ]).map(({ id, Icon, label }) => (
                    <motion.button
                      key={id}
                      onClick={() => setActiveToolbar(activeToolbar === id ? null : id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-[5px] py-[6px] px-[10px] rounded-[8px] cursor-pointer transition-all text-[10px] font-medium
                        ${activeToolbar === id
                          ? 'bg-[rgba(0,178,169,0.2)] text-[#00B2A9]'
                          : 'text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]'
                        }`}
                    >
                      <Icon className="w-[13px] h-[13px]" />
                      {label}
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence>
                  {activeToolbar === "text" && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      className="absolute bottom-[60px] left-1/2 -translate-x-1/2 z-[20] w-[90%] max-w-[400px] p-[12px] bg-[rgba(0,0,0,0.8)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.1)] rounded-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col gap-[8px]"
                    >
                      <input
                        type="text"
                        value={headline}
                        onChange={e => setHeadline(e.target.value)}
                        placeholder="Headline..."
                        maxLength={60}
                        className="w-full py-[10px] px-[12px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] rounded-[8px] text-white font-['Poppins'] text-[14px] font-bold outline-none focus:border-[rgba(0,178,169,0.4)] placeholder:text-[rgba(255,255,255,0.25)]"
                      />
                      <input
                        type="text"
                        value={subtext}
                        onChange={e => setSubtext(e.target.value)}
                        placeholder="Subtext..."
                        maxLength={40}
                        className="w-full py-[8px] px-[12px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] rounded-[8px] text-white font-['Poppins'] text-[12px] font-medium outline-none focus:border-[rgba(0,178,169,0.4)] placeholder:text-[rgba(255,255,255,0.25)]"
                      />
                    </motion.div>
                  )}

                  {activeToolbar === "position" && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      className="absolute bottom-[60px] left-1/2 -translate-x-1/2 z-[20] p-[10px] bg-[rgba(0,0,0,0.8)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.1)] rounded-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col gap-[8px]"
                    >
                      <div className="flex items-center gap-[4px]">
                        <span className="text-[9px] font-medium text-[rgba(255,255,255,0.35)] w-[50px]">Mode</span>
                        <div className="flex gap-[3px]">
                          <motion.button
                            onClick={() => { setTextFreeMode(false); }}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.93 }}
                            title="Grid Snap"
                            className={`flex items-center justify-center gap-[4px] h-[32px] px-[10px] rounded-[8px] cursor-pointer transition-all text-[10px] font-medium
                              ${!textFreeMode
                                ? 'bg-[rgba(0,178,169,0.2)] text-[#00B2A9]'
                                : 'text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]'
                              }`}
                          >
                            <Move className="w-[13px] h-[13px]" />Grid
                          </motion.button>
                          <motion.button
                            onClick={() => { setTextFreeMode(true); setTextPos({ x: 50, y: 50 }); }}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.93 }}
                            title="Free Drag"
                            className={`flex items-center justify-center gap-[4px] h-[32px] px-[10px] rounded-[8px] cursor-pointer transition-all text-[10px] font-medium
                              ${textFreeMode
                                ? 'bg-[rgba(0,178,169,0.2)] text-[#00B2A9]'
                                : 'text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]'
                              }`}
                          >
                            <Hand className="w-[13px] h-[13px]" />Free
                          </motion.button>
                          {textFreeMode && (
                            <motion.button
                              onClick={() => { setTextPos({ x: 50, y: 50 }); }}
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.93 }}
                              title="Reset to center"
                              className="flex items-center justify-center w-[32px] h-[32px] rounded-[8px] cursor-pointer transition-all text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]"
                            >
                              <RotateCcw className="w-[13px] h-[13px]" />
                            </motion.button>
                          )}
                        </div>
                      </div>
                      {textFreeMode && (
                        <>
                          <div className="w-full h-[1px] bg-[rgba(255,255,255,0.06)]" />
                          <div className="flex items-center gap-[6px]">
                            <span className="text-[9px] font-medium text-[rgba(255,255,255,0.35)] w-[50px]">Position</span>
                            <span className="text-[10px] font-mono text-[rgba(255,255,255,0.5)]">
                              X: {Math.round(textPos.x)}% &nbsp; Y: {Math.round(textPos.y)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-[6px]">
                            <span className="text-[9px] font-medium text-[rgba(255,255,255,0.35)] w-[50px]">Tip</span>
                            <span className="text-[9px] text-[rgba(255,255,255,0.3)] italic">Drag text on preview · pink guides show alignment</span>
                          </div>
                        </>
                      )}
                      {!textFreeMode && (
                        <>
                          <div className="w-full h-[1px] bg-[rgba(255,255,255,0.06)]" />
                          <div className="flex items-center gap-[4px]">
                            <span className="text-[9px] font-medium text-[rgba(255,255,255,0.35)] w-[50px]">Align</span>
                            <div className="flex gap-[3px]">
                              {ALIGN_OPTIONS.map(({ id, label, Icon }) => {
                                const isActive = effectiveAlign === id;
                                return (
                                  <motion.button
                                    key={id}
                                    onClick={() => setTextAlign(id === defaultAlign ? null : id)}
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.93 }}
                                    title={label}
                                    className={`flex items-center justify-center w-[36px] h-[32px] rounded-[8px] cursor-pointer transition-all
                                      ${isActive
                                        ? 'bg-[rgba(0,178,169,0.2)] text-[#00B2A9]'
                                        : 'text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]'
                                      }`}
                                  >
                                    <Icon className="w-[15px] h-[15px]" />
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="w-full h-[1px] bg-[rgba(255,255,255,0.06)]" />
                          <div className="flex items-center gap-[4px]">
                            <span className="text-[9px] font-medium text-[rgba(255,255,255,0.35)] w-[50px]">Vertical</span>
                            <div className="flex gap-[3px]">
                              {VPOS_OPTIONS.map(({ id, label, Icon }) => {
                                const isActive = effectiveVpos === id;
                                return (
                                  <motion.button
                                    key={id}
                                    onClick={() => setTextVpos(id === defaultVpos ? null : id)}
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.93 }}
                                    title={label}
                                    className={`flex items-center justify-center w-[36px] h-[32px] rounded-[8px] cursor-pointer transition-all
                                      ${isActive
                                        ? 'bg-[rgba(0,178,169,0.2)] text-[#00B2A9]'
                                        : 'text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]'
                                      }`}
                                  >
                                    <Icon className="w-[15px] h-[15px]" />
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                  {activeToolbar === "style" && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      className="absolute bottom-[60px] left-1/2 -translate-x-1/2 z-[20] p-[8px] bg-[rgba(0,0,0,0.8)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.1)] rounded-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex gap-[4px]"
                    >
                      {STYLE_OPTIONS.map(({ id, label }) => {
                        const isActive = effectiveStyle === id;
                        return (
                          <motion.button
                            key={id}
                            onClick={() => setTextStyle(id === activeTemplate?.textStyle ? null : id)}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.93 }}
                            className={`py-[8px] px-[14px] rounded-[10px] cursor-pointer transition-all text-[11px] font-semibold
                              ${isActive
                                ? 'bg-[rgba(0,178,169,0.2)] text-[#00B2A9]'
                                : 'text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]'
                              }`}
                          >
                            {label}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}

                  {activeToolbar === "color" && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      className="absolute bottom-[60px] left-1/2 -translate-x-1/2 z-[20] p-[10px] bg-[rgba(0,0,0,0.8)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.1)] rounded-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex gap-[6px]"
                    >
                      {COLOR_OPTIONS.map(({ id, label, color }) => {
                        const isActive = headlineColor === id;
                        return (
                          <motion.button
                            key={label}
                            onClick={() => setHeadlineColor(id)}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            title={label}
                            className={`w-[28px] h-[28px] rounded-full border-[2px] cursor-pointer transition-all
                              ${isActive
                                ? 'border-[#00B2A9] ring-[2px] ring-[#00B2A9] ring-offset-[2px] ring-offset-[rgba(0,0,0,0.8)]'
                                : 'border-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.4)]'
                              }`}
                          >
                            <div className={`w-full h-full rounded-full ${color}`} />
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
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
