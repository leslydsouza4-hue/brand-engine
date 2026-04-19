import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutTemplate, MonitorPlay, Presentation, Mail, Bot, Check, X, Upload, Image as ImageIcon, Move, AlignCenter, AlignLeft, AlignRight, ArrowUp, ArrowDown, Minus, Type, Palette, Bold, Eraser, Loader2, RotateCcw, Hand, Stamp, Sparkles, ExternalLink, Download as DownloadIcon, Edit3, Save, LayoutGrid, type LucideIcon } from "lucide-react";
import { HIGHLY_POSES } from "./highlyData";
import { LOGO_VARIANTS, DESIGN_SCENES } from "./aiPickers";
import { LivePreview } from "./LivePreview";
import { DownloadButton } from "./DownloadButton";
import { useExport } from "./useExport";

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
  const { isExporting, handleExport } = useExport();
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
  const [showLogoOverlay, setShowLogoOverlay] = useState(false);
  const [logoPlacement, setLogoPlacement] = useState<"top-left" | "bottom-left">("top-left");

  const AI_FORMATS = [
    {
      id: "social", name: "Social", icon: LayoutTemplate,
      sizes: [
        { value: "1080x1080", label: "Instagram Square (1080×1080)" },
        { value: "1080x1350", label: "Instagram Portrait (1080×1350)" },
        { value: "1080x1920", label: "Story / Reel (1080×1920)" },
        { value: "1200x628", label: "Twitter / FB Landscape (1200×628)" },
      ],
    },
    {
      id: "ads", name: "Ads", icon: MonitorPlay,
      sizes: [
        { value: "728x90", label: "Leaderboard (728×90)" },
        { value: "300x250", label: "Medium Rectangle (300×250)" },
        { value: "1200x628", label: "Wide Banner (1200×628)" },
        { value: "1280x720", label: "YouTube Thumbnail (1280×720)" },
      ],
    },
    {
      id: "presentation", name: "Presentation", icon: Presentation,
      sizes: [
        { value: "1920x1080", label: "Widescreen 16:9 (1920×1080)" },
        { value: "1024x768", label: "Standard 4:3 (1024×768)" },
        { value: "2520x1080", label: "Ultra Wide 21:9 (2520×1080)" },
        { value: "1080x1080", label: "Square 1:1 (1080×1080)" },
      ],
    },
    {
      id: "email", name: "Email", icon: Mail,
      sizes: [
        { value: "600x200", label: "Email Header (600×200)" },
        { value: "600x300", label: "Email Banner (600×300)" },
        { value: "600x400", label: "Email Hero (600×400)" },
        { value: "600x600", label: "Email Square (600×600)" },
      ],
    },
  ] as const;

  const [aiMode, setAiMode] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiCategoryId, setAiCategoryId] = useState<typeof AI_FORMATS[number]["id"]>("social");
  const [aiAspect, setAiAspect] = useState("1080x1080");
  const [aiModel, setAiModel] = useState<"claude-sonnet-4-6" | "claude-opus-4-6" | "claude-opus-4-7">("claude-sonnet-4-6");
  const [aiSlides, setAiSlides] = useState<string[]>([]);
  const [aiSlideIndex, setAiSlideIndex] = useState(0);
  const [aiSlideCount, setAiSlideCount] = useState(1);
  const [aiSlidePrompts, setAiSlidePrompts] = useState<string[]>([]);
  const [aiEditMode, setAiEditMode] = useState(false);
  const [aiGridView, setAiGridView] = useState(false);
  const [aiSavingEdits, setAiSavingEdits] = useState(false);
  const [aiLoadingPhrase, setAiLoadingPhrase] = useState(0);
  const [aiLoadingProgress, setAiLoadingProgress] = useState(0);
  const [aiLoadingFact, setAiLoadingFact] = useState(0);
  const aiPreviewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiIncludeLogo, setAiIncludeLogo] = useState(true);
  const [aiLogoId, setAiLogoId] = useState<string>(LOGO_VARIANTS[0]?.id ?? "");
  const [aiIncludeHighly, setAiIncludeHighly] = useState(false);
  const [aiHighlyPoseId, setAiHighlyPoseId] = useState<string>(HIGHLY_POSES[0]?.id ?? "");
  const [aiSceneId, setAiSceneId] = useState<string>(DESIGN_SCENES[0]?.id ?? "auto");
  const [aiPolishing, setAiPolishing] = useState(false);
  const [aiPolishError, setAiPolishError] = useState<string | null>(null);

  const aiAspectRatio = (() => {
    const m = aiAspect.match(/^(\d+)\s*x\s*(\d+)$/i);
    if (!m) return 1200 / 630;
    return parseInt(m[1]!, 10) / parseInt(m[2]!, 10);
  })();

  const aiCanvasDims = (() => {
    const m = aiAspect.match(/^(\d+)\s*x\s*(\d+)$/i);
    return m ? { w: parseInt(m[1]!, 10), h: parseInt(m[2]!, 10) } : { w: 1200, h: 630 };
  })();

  const wrapWithFit = (html: string, w: number, h: number) => {
    const inject = `<style>
      html, body { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: #0B1426 !important; }
      body { display: flex !important; align-items: center !important; justify-content: center !important; min-height: 100% !important; }
      body > * { flex-shrink: 0 !important; transform-origin: center center !important; }
    </style>
    <script>
      (function(){
        var W = ${w}, H = ${h};
        function fit() {
          var root = document.body && document.body.firstElementChild;
          if (!root) return;
          root.style.width = W + 'px';
          root.style.height = H + 'px';
          var s = Math.min(window.innerWidth / W, window.innerHeight / H);
          root.style.transform = 'scale(' + s + ')';
        }
        window.addEventListener('resize', fit);
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', fit);
        } else { fit(); }
        setTimeout(fit, 60);
      })();
    </script>`;
    if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${inject}</head>`);
    if (/<body[^>]*>/i.test(html)) return html.replace(/<body([^>]*)>/i, `<head>${inject}</head><body$1>`);
    return `${inject}${html}`;
  };

  const aiHtml = aiSlides[aiSlideIndex] ?? null;
  const aiHtmlScaled = aiHtml ? wrapWithFit(aiHtml, aiCanvasDims.w, aiCanvasDims.h) : null;

  const wrapWithEditor = (html: string, w: number, h: number) => {
    const inject = `<style data-editor-injected>
      html, body { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: #0B1426 !important; }
      body { display: flex !important; align-items: center !important; justify-content: center !important; min-height: 100% !important; }
      body > * { flex-shrink: 0 !important; transform-origin: center center !important; }
      [data-edit-hover]:not([data-edit-active]):not([data-edit-dragging]):not([data-edit-selected]) { outline: 2px dashed #5EE6DE !important; outline-offset: 2px !important; cursor: grab !important; }
      [data-edit-active] { outline: 2px solid #FFC328 !important; outline-offset: 2px !important; box-shadow: 0 0 0 4px rgba(255,195,40,0.18) !important; cursor: text !important; }
      [data-edit-selected]:not([data-edit-active]) { outline: 2px solid #2896FB !important; outline-offset: 2px !important; box-shadow: 0 0 0 4px rgba(40,150,251,0.18) !important; }
      [data-edit-dragging] { outline: 2px solid #2896FB !important; outline-offset: 2px !important; box-shadow: 0 0 0 4px rgba(40,150,251,0.22) !important; cursor: grabbing !important; opacity: 0.95 !important; }
      [data-editor-handles] { position: fixed !important; top: 0 !important; left: 0 !important; pointer-events: none !important; z-index: 99999 !important; }
      [data-editor-handle] { position: fixed !important; width: 14px !important; height: 14px !important; background: #FFC328 !important; border: 2px solid #0B1426 !important; border-radius: 3px !important; pointer-events: auto !important; box-shadow: 0 0 0 1px rgba(255,195,40,0.5), 0 2px 6px rgba(0,0,0,0.45) !important; }
    </style>
    <script data-editor-injected>
      (function(){
        var W = ${w}, H = ${h};
        function fit() {
          var root = document.body && document.body.firstElementChild;
          if (!root) return;
          root.style.width = W + 'px';
          root.style.height = H + 'px';
          var s = Math.min(window.innerWidth / W, window.innerHeight / H);
          root.style.transform = 'scale(' + s + ')';
        }
        window.addEventListener('resize', fit);
        function isLeafText(el){
          if (!el || el === document.body || el === document.documentElement) return false;
          if (el.children && el.children.length > 0) return false;
          var t = (el.textContent || '').trim();
          return t.length > 0;
        }
        function isMovable(el){
          if (!el || el === document.body || el === document.documentElement) return false;
          var root = document.body && document.body.firstElementChild;
          if (!el || el === root) return false;
          if (el.closest('[data-edit-active]')) return false;
          return true;
        }
        function getScale(){
          var root = document.body && document.body.firstElementChild;
          if (!root) return 1;
          var m = (root.style.transform || '').match(/scale\\(([\\d.]+)\\)/);
          return m ? parseFloat(m[1]) : 1;
        }
        function clearActive(){
          document.querySelectorAll('[data-edit-active]').forEach(function(n){
            n.removeAttribute('data-edit-active');
            n.removeAttribute('contenteditable');
            n.blur && n.blur();
          });
        }
        function ensureBase(el){
          if (!el.hasAttribute('data-edit-base-transform')) {
            el.setAttribute('data-edit-base-transform', el.style.transform || '');
          }
          if (!el.hasAttribute('data-edit-base-origin')) {
            var co = window.getComputedStyle(el).transformOrigin || '';
            el.setAttribute('data-edit-base-origin', el.style.transformOrigin || co);
          }
        }
        function applyTransform(el){
          var base = el.getAttribute('data-edit-base-transform') || '';
          var tx = parseFloat(el.getAttribute('data-edit-tx') || '0');
          var ty = parseFloat(el.getAttribute('data-edit-ty') || '0');
          var s = parseFloat(el.getAttribute('data-edit-scale') || '1');
          var origin = el.getAttribute('data-edit-origin') || '';
          var parts = [];
          if (tx || ty) parts.push('translate(' + tx + 'px,' + ty + 'px)');
          if (s && s !== 1) parts.push('scale(' + s + ')');
          if (base) parts.push(base);
          el.style.transform = parts.join(' ').trim();
          if (origin) el.style.transformOrigin = origin;
        }

        var selectedEl = null;
        var handlesRoot = null;
        var rafId = 0;
        function buildHandles(){
          if (handlesRoot) return;
          handlesRoot = document.createElement('div');
          handlesRoot.setAttribute('data-editor-handles', '1');
          handlesRoot.setAttribute('data-editor-injected', '1');
          ['nw','ne','sw','se'].forEach(function(c){
            var h = document.createElement('div');
            h.setAttribute('data-editor-handle', c);
            h.setAttribute('data-editor-injected', '1');
            h.style.cursor = (c === 'nw' || c === 'se' ? 'nwse-resize' : 'nesw-resize');
            h.addEventListener('mousedown', function(ev){ startResize(ev, c); }, true);
            handlesRoot.appendChild(h);
          });
          document.body.appendChild(handlesRoot);
        }
        function destroyHandles(){
          if (handlesRoot && handlesRoot.parentNode) handlesRoot.parentNode.removeChild(handlesRoot);
          handlesRoot = null;
        }
        function positionHandles(){
          if (!selectedEl || !handlesRoot) return;
          var r = selectedEl.getBoundingClientRect();
          var pts = { nw:[r.left,r.top], ne:[r.right,r.top], sw:[r.left,r.bottom], se:[r.right,r.bottom] };
          Array.prototype.forEach.call(handlesRoot.children, function(h){
            var p = pts[h.getAttribute('data-editor-handle')];
            if (!p) return;
            h.style.left = (p[0] - 7) + 'px';
            h.style.top = (p[1] - 7) + 'px';
          });
        }
        function selectElement(el){
          if (selectedEl === el) { positionHandles(); return; }
          clearSelection();
          selectedEl = el;
          el.setAttribute('data-edit-selected', '1');
          ensureBase(el);
          buildHandles();
          positionHandles();
        }
        function clearSelection(){
          if (selectedEl) {
            selectedEl.removeAttribute('data-edit-selected');
            selectedEl = null;
          }
          destroyHandles();
        }

        var dragState = null;
        var resizeState = null;
        var suppressClick = false;
        document.addEventListener('mouseover', function(e){
          var el = e.target;
          if (!el || !(el instanceof Element)) return;
          if (el.hasAttribute('data-editor-handle')) return;
          if (!isMovable(el)) return;
          el.setAttribute('data-edit-hover', '1');
        }, true);
        document.addEventListener('mouseout', function(e){
          var el = e.target;
          if (!el || !(el instanceof Element)) return;
          el.removeAttribute('data-edit-hover');
        }, true);
        document.addEventListener('mousedown', function(e){
          if (e.button !== 0) return;
          var el = e.target;
          if (!el || !(el instanceof Element)) return;
          if (el.hasAttribute('data-editor-handle')) return;
          if (!isMovable(el)) return;
          if (el.getAttribute('contenteditable') === 'true') return;
          ensureBase(el);
          dragState = {
            el: el,
            startX: e.clientX, startY: e.clientY,
            startTx: parseFloat(el.getAttribute('data-edit-tx') || '0'),
            startTy: parseFloat(el.getAttribute('data-edit-ty') || '0'),
            moved: false
          };
        }, true);
        document.addEventListener('mousemove', function(e){
          if (resizeState) {
            e.preventDefault();
            var d = Math.hypot(e.clientX - resizeState.anchor[0], e.clientY - resizeState.anchor[1]);
            var ratio = d / Math.max(resizeState.startDist, 1);
            var newScale = Math.max(0.2, Math.min(8, resizeState.startScale * ratio));
            resizeState.el.setAttribute('data-edit-scale', String(newScale));
            applyTransform(resizeState.el);
            if (!rafId) rafId = requestAnimationFrame(function(){ rafId = 0; positionHandles(); });
            return;
          }
          if (!dragState) return;
          var dx = e.clientX - dragState.startX;
          var dy = e.clientY - dragState.startY;
          if (!dragState.moved && (Math.abs(dx) + Math.abs(dy)) < 5) return;
          dragState.moved = true;
          e.preventDefault();
          var s = getScale() || 1;
          dragState.el.setAttribute('data-edit-dragging', '1');
          dragState.el.setAttribute('data-edit-tx', String(dragState.startTx + dx/s));
          dragState.el.setAttribute('data-edit-ty', String(dragState.startTy + dy/s));
          applyTransform(dragState.el);
          if (selectedEl === dragState.el && !rafId) rafId = requestAnimationFrame(function(){ rafId = 0; positionHandles(); });
        }, true);
        document.addEventListener('mouseup', function(e){
          if (resizeState) {
            resizeState = null;
            suppressClick = true;
            setTimeout(function(){ suppressClick = false; }, 50);
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          if (!dragState) return;
          var st = dragState; dragState = null;
          st.el.removeAttribute('data-edit-dragging');
          if (st.moved) {
            suppressClick = true;
            setTimeout(function(){ suppressClick = false; }, 50);
            e.preventDefault();
            e.stopPropagation();
          }
        }, true);
        function startResize(e, corner){
          if (!selectedEl) return;
          e.preventDefault();
          e.stopPropagation();
          var r = selectedEl.getBoundingClientRect();
          var anchor = ({ nw:[r.right,r.bottom], ne:[r.left,r.bottom], sw:[r.right,r.top], se:[r.left,r.top] })[corner];
          var origin = ({ nw:'bottom right', ne:'bottom left', sw:'top right', se:'top left' })[corner];
          ensureBase(selectedEl);
          selectedEl.setAttribute('data-edit-origin', origin);
          var startScale = parseFloat(selectedEl.getAttribute('data-edit-scale') || '1');
          var startDist = Math.hypot(e.clientX - anchor[0], e.clientY - anchor[1]);
          resizeState = { el: selectedEl, anchor: anchor, startDist: startDist, startScale: startScale };
        }
        window.addEventListener('scroll', positionHandles, true);
        window.addEventListener('resize', positionHandles);
        document.addEventListener('click', function(e){
          if (suppressClick) { e.preventDefault(); e.stopPropagation(); return; }
          var el = e.target;
          if (!el || !(el instanceof Element)) return;
          if (el.hasAttribute('data-editor-handle')) return;
          if (!isMovable(el)) { clearActive(); clearSelection(); return; }
          e.preventDefault();
          e.stopPropagation();
          if (isLeafText(el)) {
            clearActive();
            selectElement(el);
            el.setAttribute('contenteditable', 'true');
            el.setAttribute('data-edit-active', '1');
            el.focus();
            var range = document.createRange();
            range.selectNodeContents(el);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          } else {
            clearActive();
            selectElement(el);
          }
        }, true);
        document.addEventListener('keydown', function(e){
          if (e.key === 'Escape') { clearActive(); clearSelection(); }
        }, true);
        window.addEventListener('message', function(ev){
          var data = ev.data || {};
          if (data && data.type === 'editor:get-html') {
            clearActive();
            document.querySelectorAll('[data-edit-hover]').forEach(function(n){ n.removeAttribute('data-edit-hover'); });
            document.querySelectorAll('[data-editor-injected]').forEach(function(n){ n.parentNode && n.parentNode.removeChild(n); });
            var root = document.body && document.body.firstElementChild;
            if (root) { root.style.transform=''; root.style.width=''; root.style.height=''; }
            var html = '<!doctype html>\\n' + document.documentElement.outerHTML;
            window.parent.postMessage({ type: 'editor:html', html: html }, '*');
          }
        });
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', fit);
        } else { fit(); }
        setTimeout(fit, 60);
      })();
    </script>`;
    if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${inject}</head>`);
    if (/<body[^>]*>/i.test(html)) return html.replace(/<body([^>]*)>/i, `<head>${inject}</head><body$1>`);
    return `${inject}${html}`;
  };

  useEffect(() => {
    setAiSlidePrompts(prev => {
      if (aiSlideCount <= 1) return [];
      const next = prev.slice(0, aiSlideCount);
      while (next.length < aiSlideCount) next.push("");
      return next;
    });
  }, [aiSlideCount]);

  const composedPrompt = (() => {
    const topic = aiPrompt.trim();
    if (aiSlideCount <= 1) return topic;
    const lines = aiSlidePrompts.map((p, i) => {
      const t = (p || "").trim();
      return `Slide ${i + 1}: ${t || "(use your judgment to follow the overall theme above)"}`;
    });
    return `${topic}\n\nPer-slide breakdown (use these as the spec for each slide; keep visual rhythm across the deck):\n${lines.join("\n")}`;
  })();

  const handlePolishPrompt = async () => {
    const idea = aiPrompt.trim();
    if (!idea || aiPolishing) return;
    setAiPolishing(true);
    setAiPolishError(null);
    try {
      const apiBase = import.meta.env.BASE_URL;
      const res = await fetch(`${apiBase}api/polish-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          aspect: aiAspect,
          includeLogo: aiIncludeLogo,
          logoDescription: aiIncludeLogo ? (LOGO_VARIANTS.find(l => l.id === aiLogoId)?.description ?? "") : "",
          includeHighly: aiIncludeHighly,
          highlyPoseDescription: aiIncludeHighly ? (HIGHLY_POSES.find(p => p.id === aiHighlyPoseId)?.description ?? "") : "",
          sceneName: DESIGN_SCENES.find(s => s.id === aiSceneId)?.name ?? "",
          sceneDescription: DESIGN_SCENES.find(s => s.id === aiSceneId)?.description ?? "",
          format: aiCategoryId,
          slideCount: aiSlideCount,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      if (!data.prompt) throw new Error("Empty polished prompt");
      setAiPrompt(data.prompt);
    } catch (err: any) {
      setAiPolishError(err?.message || "Polish failed");
    } finally {
      setAiPolishing(false);
    }
  };

  const AI_LOADING_FACTS = [
    "HighLevel powers 40,000+ agencies and 1.2M+ businesses worldwide.",
    "12.2 billion conversations have flowed through HighLevel.",
    "1.9 billion leads facilitated — and counting.",
    "3,000+ new customers join HighLevel every month.",
    "One platform. CRM, automations, funnels, AI agents, calls, payments.",
    "Voice AI answers calls 24/7, with unlimited simultaneous conversations.",
    "Snapshots clone an entire sub-account — onboarding in minutes, not days.",
    "SaaS Mode lets agencies resell HighLevel as their own product.",
    "Rebilling agencies have collected over $13.4M in margin.",
    "$297/mo unlocks unlimited sub-accounts, users, and contacts.",
    "Founded in 2018 by Shaun, Robin, and Varun.",
    "Affiliates have earned $13M+ — four became millionaires through it.",
    "Workflow AI Assistant builds automations step-by-step alongside you.",
    "White-label the whole platform on your own domain.",
    "Replaces ClickFunnels, Mailchimp, Calendly, Kajabi, ActiveCampaign — combined.",
  ];
  const AI_LOADING_PHRASES = [
    "Studying the HighLevel brand voice…",
    "Selecting palette accents…",
    "Composing the headline…",
    "Placing the focal orb…",
    "Balancing whitespace…",
    "Sketching badge clusters…",
    "Aligning the wordmark…",
    "Tuning hierarchy…",
    "Polishing the CTA pill…",
    "Rendering final pixels…",
  ];

  useEffect(() => {
    if (!aiLoading) { setAiLoadingPhrase(0); setAiLoadingProgress(0); return; }
    setAiLoadingFact(Math.floor(Math.random() * AI_LOADING_FACTS.length));
    const t0 = Date.now();
    const phraseTimer = window.setInterval(() => {
      setAiLoadingPhrase((p) => (p + 1) % AI_LOADING_PHRASES.length);
    }, 1700);
    const factTimer = window.setInterval(() => {
      setAiLoadingFact((p) => (p + 1) % AI_LOADING_FACTS.length);
    }, 4800);
    const progressTimer = window.setInterval(() => {
      const elapsed = (Date.now() - t0) / 1000;
      const target = 1 - Math.exp(-elapsed / 14);
      setAiLoadingProgress(Math.min(0.96, target));
    }, 120);
    return () => { window.clearInterval(phraseTimer); window.clearInterval(factTimer); window.clearInterval(progressTimer); };
  }, [aiLoading]);

  const handleSaveInlineEdits = useCallback(async () => {
    const iframe = aiPreviewIframeRef.current;
    if (!iframe || !iframe.contentWindow || aiSavingEdits) return;
    setAiSavingEdits(true);
    try {
      const html: string = await new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          window.removeEventListener("message", onMsg);
          reject(new Error("Timed out reading edited HTML"));
        }, 4000);
        function onMsg(ev: MessageEvent) {
          const d: any = ev.data;
          if (!d || d.type !== "editor:html" || typeof d.html !== "string") return;
          window.clearTimeout(timeout);
          window.removeEventListener("message", onMsg);
          resolve(d.html);
        }
        window.addEventListener("message", onMsg);
        iframe.contentWindow!.postMessage({ type: "editor:get-html" }, "*");
      });
      let cleaned = html
        .replace(/<div\s+data-editor-handles[^>]*>[\s\S]*?<\/div>/gi, "")
        .replace(/<style\s+data-editor-injected[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script\s+data-editor-injected[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/\s+data-edit-(?:hover|active|dragging|moved|selected|base-transform|base-origin|tx|ty|scale|origin)="[^"]*"/gi, "")
        .replace(/\s+contenteditable="[^"]*"/gi, "");
      setAiSlides((prev) => {
        if (!prev.length) return prev;
        const next = prev.slice();
        next[aiSlideIndex] = cleaned;
        return next;
      });
      setAiEditMode(false);
    } catch (err) {
      // swallow — leave edit mode active so user can retry
    } finally {
      setAiSavingEdits(false);
    }
  }, [aiSavingEdits, aiSlideIndex]);

  const handleGenerateAI = async () => {
    const prompt = composedPrompt.trim();
    if (!prompt || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const apiBase = import.meta.env.BASE_URL;
      const res = await fetch(`${apiBase}api/claude-design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspect: aiAspect,
          model: aiModel,
          logoUrl: aiIncludeLogo ? (() => {
            const variant = LOGO_VARIANTS.find(l => l.id === aiLogoId) ?? LOGO_VARIANTS[0];
            return variant ? `${window.location.origin}${variant.file}` : "";
          })() : "",
          logoDescription: aiIncludeLogo ? (LOGO_VARIANTS.find(l => l.id === aiLogoId)?.description ?? "") : "",
          highlyUrl: aiIncludeHighly ? (() => {
            const pose = HIGHLY_POSES.find(p => p.id === aiHighlyPoseId) ?? HIGHLY_POSES[0];
            return pose ? `${window.location.origin}${pose.image}` : "";
          })() : "",
          highlyPoseDescription: aiIncludeHighly ? (HIGHLY_POSES.find(p => p.id === aiHighlyPoseId)?.description ?? "") : "",
          sceneName: DESIGN_SCENES.find(s => s.id === aiSceneId)?.name ?? "",
          sceneDescription: DESIGN_SCENES.find(s => s.id === aiSceneId)?.description ?? "",
          slideCount: aiSlideCount,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      const slides: string[] = Array.isArray(data.slides) && data.slides.length
        ? data.slides
        : (data.html ? [data.html] : []);
      if (!slides.length) throw new Error("No HTML returned");
      setAiSlides(slides);
      setAiSlideIndex(0);
    } catch (err: any) {
      setAiError(err?.message || "Generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIDownloadHtml = () => {
    if (!aiHtml) return;
    const blob = new Blob([aiHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claude-design-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAIOpen = () => {
    if (!aiHtml) return;
    const w = window.open("", "_blank");
    if (w) { w.document.open(); w.document.write(aiHtml); w.document.close(); }
  };

  const [aiExporting, setAiExporting] = useState<null | "png" | "jpeg" | "pdf">(null);

  const renderHtmlToCanvas = async (html: string): Promise<HTMLCanvasElement | null> => {
    if (!html) return null;
    const { w, h } = aiCanvasDims;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-99999px";
    iframe.style.top = "0";
    iframe.style.width = `${w}px`;
    iframe.style.height = `${h}px`;
    iframe.style.border = "0";
    iframe.setAttribute("sandbox", "allow-same-origin allow-scripts");
    document.body.appendChild(iframe);
    try {
      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        iframe.srcdoc = html;
      });
      const doc = iframe.contentDocument;
      if (!doc) return null;

      // Strip body's flex-centering so the canvas root sits at (0,0).
      // The system prompt always centers .canvas inside body via flex —
      // for export we want it pinned to origin so html2canvas captures it
      // crisply at native size with no offset.
      const fixStyle = doc.createElement("style");
      fixStyle.textContent = `
        html, body { margin:0 !important; padding:0 !important; width:${w}px !important; height:${h}px !important; min-height:0 !important; overflow:hidden !important; display:block !important; background:#0B1426 !important; }
        body > .canvas, body > div:first-child { position: relative !important; left: 0 !important; top: 0 !important; margin: 0 !important; transform: none !important; }
      `;
      doc.head.appendChild(fixStyle);

      // Wait for images.
      const imgs = Array.from(doc.images);
      await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise<void>(r => { img.onload = () => r(); img.onerror = () => r(); })));
      // Wait for web fonts (Poppins etc.) — biggest cause of layout shift.
      try { if ((doc as any).fonts && (doc as any).fonts.ready) await (doc as any).fonts.ready; } catch {}
      // Settle.
      await new Promise(r => setTimeout(r, 200));

      // Prefer capturing the .canvas root if present; otherwise body.
      const target = (doc.querySelector(".canvas") as HTMLElement | null) ?? doc.body;

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(target, {
        width: w,
        height: h,
        windowWidth: w,
        windowHeight: h,
        backgroundColor: "#0B1426",
        useCORS: true,
        scale: 1,
        logging: false,
        x: 0,
        y: 0,
      });
      return canvas;
    } finally {
      document.body.removeChild(iframe);
    }
  };

  const renderAIToCanvas = async (): Promise<HTMLCanvasElement | null> =>
    aiHtml ? renderHtmlToCanvas(aiHtml) : null;

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAIDownloadImage = async (kind: "png" | "jpeg") => {
    if (!aiHtml || aiExporting) return;
    setAiExporting(kind);
    try {
      const canvas = await renderAIToCanvas();
      if (!canvas) throw new Error("Render failed");
      const mime = kind === "png" ? "image/png" : "image/jpeg";
      const ext = kind === "png" ? "png" : "jpg";
      const quality = kind === "jpeg" ? 0.95 : undefined;
      await new Promise<void>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) downloadBlob(blob, `claude-design-${Date.now()}.${ext}`);
          resolve();
        }, mime, quality);
      });
    } catch (err) {
      console.error("[ai-export]", err);
      setAiError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setAiExporting(null);
    }
  };

  const handleAIDownloadPdf = async () => {
    if (!aiHtml || aiExporting) return;
    setAiExporting("pdf");
    try {
      const canvas = await renderAIToCanvas();
      if (!canvas) throw new Error("Render failed");
      const { jsPDF } = await import("jspdf");
      const { w, h } = aiCanvasDims;
      const pdf = new jsPDF({
        orientation: w >= h ? "landscape" : "portrait",
        unit: "px",
        format: [w, h],
        hotfixes: ["px_scaling"],
      });
      const dataUrl = canvas.toDataURL("image/png");
      pdf.addImage(dataUrl, "PNG", 0, 0, w, h);
      pdf.save(`claude-design-${Date.now()}.pdf`);
    } catch (err) {
      console.error("[ai-export-pdf]", err);
      setAiError(err instanceof Error ? err.message : "PDF export failed");
    } finally {
      setAiExporting(null);
    }
  };

  const [aiExportAllProgress, setAiExportAllProgress] = useState<{ done: number; total: number } | null>(null);
  const handleAIDownloadAllPdf = async () => {
    if (aiSlides.length === 0 || aiExporting) return;
    setAiExporting("pdf");
    setAiExportAllProgress({ done: 0, total: aiSlides.length });
    try {
      const { jsPDF } = await import("jspdf");
      const { w, h } = aiCanvasDims;
      const pdf = new jsPDF({
        orientation: w >= h ? "landscape" : "portrait",
        unit: "px",
        format: [w, h],
        hotfixes: ["px_scaling"],
      });
      for (let i = 0; i < aiSlides.length; i++) {
        const html = aiSlides[i]!;
        const canvas = await renderHtmlToCanvas(html);
        if (!canvas) continue;
        const dataUrl = canvas.toDataURL("image/png");
        if (i > 0) pdf.addPage([w, h], w >= h ? "landscape" : "portrait");
        pdf.addImage(dataUrl, "PNG", 0, 0, w, h);
        setAiExportAllProgress({ done: i + 1, total: aiSlides.length });
      }
      pdf.save(`claude-carousel-${Date.now()}.pdf`);
    } catch (err) {
      console.error("[ai-export-all-pdf]", err);
      setAiError(err instanceof Error ? err.message : "PDF export failed");
    } finally {
      setAiExporting(null);
      setAiExportAllProgress(null);
    }
  };

  const handleAIDownloadAllPng = async () => {
    if (aiSlides.length === 0 || aiExporting) return;
    setAiExporting("png");
    setAiExportAllProgress({ done: 0, total: aiSlides.length });
    try {
      const stamp = Date.now();
      for (let i = 0; i < aiSlides.length; i++) {
        const html = aiSlides[i]!;
        const canvas = await renderHtmlToCanvas(html);
        if (!canvas) continue;
        const blob: Blob | null = await new Promise(r => canvas.toBlob(b => r(b), "image/png"));
        if (blob) downloadBlob(blob, `claude-carousel-${stamp}-slide-${String(i + 1).padStart(2, "0")}.png`);
        setAiExportAllProgress({ done: i + 1, total: aiSlides.length });
      }
    } catch (err) {
      console.error("[ai-export-all-png]", err);
      setAiError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setAiExporting(null);
      setAiExportAllProgress(null);
    }
  };

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
    setShowLogoOverlay(false);
    setLogoPlacement("top-left");
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

        {!isCard && showLogoOverlay && (
          <img
            src={LOGO_LIGHT}
            alt="HighLevel"
            className="absolute z-[8] object-contain pointer-events-none select-none"
            style={{
              height: "5%",
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
              ...(logoPlacement === "top-left" ? { top: "5%", left: "5%" } : { bottom: "5%", left: "5%" }),
            }}
            draggable={false}
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
        {aiMode ? (
          <>
            <div className="text-[14px] font-bold text-white mb-[1px]">Generate with Claude</div>
            <div className="text-[11.5px] text-[#475569] mb-[16px]">Trained on HighLevel brand. Describe what you want.</div>

            <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[6px]">Model</div>
            <div className="flex gap-[4px] p-[3px] mb-[14px] bg-[rgba(255,255,255,0.025)] rounded-[10px] border border-[rgba(255,255,255,0.05)]">
              {([
                { id: "claude-sonnet-4-6", label: "Sonnet 4.6", hint: "Fast" },
                { id: "claude-opus-4-6", label: "Opus 4.6", hint: "Smart" },
                { id: "claude-opus-4-7", label: "Opus 4.7", hint: "Best" },
              ] as const).map(m => (
                <button
                  key={m.id}
                  onClick={() => setAiModel(m.id)}
                  title={m.hint}
                  className={`flex-1 py-[7px] rounded-[7px] text-[10.5px] font-bold transition-all border-none cursor-pointer ${
                    aiModel === m.id ? "bg-[rgba(0,178,169,0.18)] text-[#5EE6DE]" : "bg-transparent text-[#64748B] hover:text-[#94A3B8]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[6px]">Format</div>
            <div className="flex gap-[8px] mb-[12px] overflow-x-auto sidebar-scroll">
              {AI_FORMATS.map(fmt => {
                const Icon = fmt.icon;
                const isActive = aiCategoryId === fmt.id;
                return (
                  <motion.div
                    key={fmt.id}
                    onClick={() => {
                      setAiCategoryId(fmt.id);
                      setAiAspect(fmt.sizes[0].value);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 min-w-[64px] flex flex-col items-center justify-center gap-[6px] py-[12px] px-[6px] rounded-[12px] cursor-pointer transition-all border ${
                      isActive
                        ? "bg-[rgba(0,178,169,0.12)] border-[rgba(0,178,169,0.35)]"
                        : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.04)]"
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] ${isActive ? "text-[#5EE6DE]" : "text-[#64748B]"}`} />
                    <div className={`text-[10.5px] font-semibold ${isActive ? "text-white" : "text-[#94A3B8]"}`}>{fmt.name}</div>
                    {isActive && <div className="h-[2px] w-[16px] rounded-full bg-[#5EE6DE]" />}
                  </motion.div>
                );
              })}
            </div>

            <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[6px]">Size</div>
            <select
              value={aiAspect}
              onChange={(e) => setAiAspect(e.target.value)}
              className="w-full mb-[12px] py-[10px] pr-[38px] pl-[14px] bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[10px] font-inherit text-[12px] font-medium text-white cursor-pointer outline-none appearance-none focus:border-[rgba(0,178,169,0.3)]"
            >
              {(AI_FORMATS.find(f => f.id === aiCategoryId) ?? AI_FORMATS[0]).sizes.map(s => (
                <option key={s.value} value={s.value} className="bg-[#0a1628]">{s.label}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-[10px] mb-[14px]">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[6px]">Scene</div>
                <select
                  value={aiSceneId}
                  onChange={(e) => setAiSceneId(e.target.value)}
                  className="w-full py-[10px] pr-[28px] pl-[12px] bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[10px] font-inherit text-[12px] font-medium text-white cursor-pointer outline-none appearance-none focus:border-[rgba(0,178,169,0.3)]"
                >
                  {DESIGN_SCENES.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#0a1628]">{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[6px]">Slides</div>
                <div className="flex items-center gap-[6px] py-[5px] pl-[6px] pr-[6px] bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[10px]">
                  <button
                    onClick={() => setAiSlideCount(c => Math.max(1, c - 1))}
                    disabled={aiSlideCount <= 1 || aiLoading}
                    className="w-[26px] h-[26px] flex items-center justify-center rounded-[6px] bg-[rgba(255,255,255,0.04)] text-[#94A3B8] hover:bg-[rgba(255,255,255,0.08)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[14px] font-bold"
                  >−</button>
                  <div className="flex-1 text-center text-[13px] font-bold text-white">
                    {aiSlideCount}
                    {aiSlideCount > 1 && <span className="ml-[4px] text-[10px] font-medium text-[#5EE6DE]">carousel</span>}
                  </div>
                  <button
                    onClick={() => setAiSlideCount(c => Math.min(10, c + 1))}
                    disabled={aiSlideCount >= 10 || aiLoading}
                    className="w-[26px] h-[26px] flex items-center justify-center rounded-[6px] bg-[rgba(255,255,255,0.04)] text-[#94A3B8] hover:bg-[rgba(255,255,255,0.08)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[14px] font-bold"
                  >+</button>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[6px]">Brand Assets</div>
            <div className="flex flex-col gap-[6px] mb-[14px]">
              <label className="flex items-center gap-[10px] py-[8px] px-[12px] bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[10px] cursor-pointer hover:bg-[rgba(255,255,255,0.04)]">
                <input
                  type="checkbox"
                  checked={aiIncludeLogo}
                  onChange={(e) => setAiIncludeLogo(e.target.checked)}
                  className="w-[14px] h-[14px] accent-[#00B2A9]"
                />
                <span className="text-[12px] font-semibold text-[#E2E8F0]">HighLevel logo</span>
                <span className="ml-auto text-[10px] text-[#475569]">corner</span>
              </label>
            </div>

            {aiIncludeLogo && (
              <>
                <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[6px]">Logo Variant</div>
                <div className="relative flex p-[3px] mb-[14px] bg-[rgba(0,0,0,0.25)] border border-[rgba(255,255,255,0.05)] rounded-[10px]">
                  {(() => {
                    const activeIndex = Math.max(0, LOGO_VARIANTS.findIndex(l => l.id === aiLogoId));
                    return (
                      <div
                        className="absolute top-[3px] bottom-[3px] rounded-[8px] transition-all duration-200 ease-out"
                        style={{
                          left: `calc(${activeIndex * 50}% + 3px)`,
                          width: "calc(50% - 6px)",
                          background: "linear-gradient(135deg, rgba(0,178,169,0.22), rgba(40,150,251,0.18))",
                          border: "1px solid rgba(0,178,169,0.35)",
                          boxShadow: "0 4px 16px rgba(0,178,169,0.15)",
                        }}
                      />
                    );
                  })()}
                  {LOGO_VARIANTS.map(variant => {
                    const isActive = aiLogoId === variant.id;
                    const tileBg = variant.recommendedOn === "light" ? "#F8FAFC" : "#0B1426";
                    return (
                      <button
                        key={variant.id}
                        onClick={() => setAiLogoId(variant.id)}
                        title={variant.description}
                        className="relative z-[2] flex-1 flex items-center justify-center gap-[8px] py-[8px] px-[10px] rounded-[8px] cursor-pointer transition-colors bg-transparent border-none"
                      >
                        <div
                          className="flex-shrink-0 w-[40px] h-[26px] rounded-[4px] flex items-center justify-center overflow-hidden"
                          style={{ background: tileBg }}
                        >
                          <img src={variant.file} alt={variant.name} className="max-w-[82%] max-h-[80%] object-contain" />
                        </div>
                        <span className={`text-[11px] font-bold tracking-[0.02em] transition-colors ${isActive ? "text-[#5EE6DE]" : "text-[#64748B]"}`}>
                          {variant.recommendedOn === "dark" ? "Light" : "Dark"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}


            <div className="flex items-center justify-between mb-[6px]">
              <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569]">
                {aiSlideCount > 1 ? "Overall Theme" : "Prompt"}
              </div>
              <button
                onClick={handlePolishPrompt}
                disabled={!aiPrompt.trim() || aiPolishing}
                title="Rewrite your prompt as a designer-grade brief"
                className="flex items-center gap-[5px] py-[4px] px-[9px] rounded-[6px] text-[10px] font-bold border cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-40 bg-[rgba(255,195,40,0.08)] border-[rgba(255,195,40,0.3)] text-[#FFC328] hover:bg-[rgba(255,195,40,0.14)]"
              >
                {aiPolishing ? (
                  <><Loader2 className="w-[10px] h-[10px] animate-spin" /><span>Polishing…</span></>
                ) : (
                  <><Sparkles className="w-[10px] h-[10px]" /><span>Polish</span></>
                )}
              </button>
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={aiSlideCount > 1
                ? "e.g. 'The Operator Era' — a 4-slide carousel about agencies switching to HighLevel. Dark editorial vibe, teal + yellow accents, bold display type."
                : "e.g. Launch graphic for our new AI Voice Agent — bold headline, glowing blue orb, capture-yellow accent badge"}
              rows={aiSlideCount > 1 ? 8 : 7}
              className="w-full py-[12px] px-[14px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-['Poppins'] text-[12.5px] text-[#E2E8F0] outline-none focus:border-[rgba(0,178,169,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569] resize-y"
            />

            {aiSlideCount > 1 && (
              <div className="mt-[18px] p-[14px] rounded-[14px] bg-[rgba(94,230,222,0.03)] border border-[rgba(94,230,222,0.12)] flex flex-col gap-[14px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[8px]">
                    <div className="w-[22px] h-[22px] flex items-center justify-center rounded-[6px] bg-[rgba(94,230,222,0.12)] border border-[rgba(94,230,222,0.3)]">
                      <LayoutGrid className="w-[12px] h-[12px] text-[#5EE6DE]" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#5EE6DE]">Per-Slide Prompts</span>
                  </div>
                  <span className="text-[9.5px] text-[#64748B]">Blank = Claude decides</span>
                </div>
                {aiSlidePrompts.map((p, i) => (
                  <div key={i} className="flex flex-col gap-[8px] pt-[4px]" style={i > 0 ? { borderTop: "1px dashed rgba(94,230,222,0.12)", paddingTop: "14px" } : undefined}>
                    <div className="flex items-center gap-[8px]">
                      <div className="w-[24px] h-[24px] flex items-center justify-center rounded-[6px] bg-[rgba(94,230,222,0.12)] border border-[rgba(94,230,222,0.3)] text-[11px] font-bold text-[#5EE6DE]">
                        {i + 1}
                      </div>
                      <span className="text-[12px] font-bold tracking-[0.02em] text-[#E2E8F0]">Slide {i + 1}</span>
                      <span className="text-[10px] text-[#64748B] ml-auto">
                        {i === 0 ? "Hook" : i === aiSlidePrompts.length - 1 ? "CTA" : `Content ${i}`}
                      </span>
                    </div>
                    <textarea
                      value={p}
                      onChange={(e) => setAiSlidePrompts(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                      placeholder={
                        i === 0 ? "Hook slide — bold headline that stops the scroll, big portrait, brand chip top-left" :
                        i === aiSlidePrompts.length - 1 ? "CTA slide — group photo, overlay headline, yellow CTA pill linking to gohighlevel.com" :
                        i === 1 ? "Proof / problem — split layout, candid human moment, 2 stat cards" :
                        "Data card — no humans, 4 stat tiles, big numbers in yellow"
                      }
                      rows={5}
                      className="w-full py-[11px] px-[13px] bg-[rgba(0,0,0,0.25)] border border-[rgba(255,255,255,0.06)] rounded-[10px] font-['Poppins'] text-[12px] leading-[1.55] text-[#E2E8F0] outline-none focus:border-[rgba(94,230,222,0.35)] focus:bg-[rgba(0,0,0,0.35)] placeholder:text-[#475569] resize-y"
                    />
                  </div>
                ))}
              </div>
            )}
            {aiPolishError && (
              <div className="mt-[8px] py-[8px] px-[10px] rounded-[8px] text-[11px] text-[#FCA5A5] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)]">
                {aiPolishError}
              </div>
            )}

            <button
              onClick={handleGenerateAI}
              disabled={!aiPrompt.trim() || aiLoading}
              className="mt-[10px] w-full flex items-center justify-center gap-[8px] py-[12px] px-[14px] rounded-[12px] text-[13px] font-bold border cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: aiLoading ? "rgba(0,178,169,0.08)" : "linear-gradient(135deg, rgba(0,178,169,0.25) 0%, rgba(40,150,251,0.2) 100%)",
                borderColor: "rgba(0,178,169,0.4)",
                color: "#5EE6DE",
              }}
            >
              {aiLoading ? (
                <><Loader2 className="w-[14px] h-[14px] animate-spin" /><span>Generating…</span></>
              ) : (
                <><Sparkles className="w-[14px] h-[14px]" /><span>Generate Design</span></>
              )}
            </button>

            {aiError && (
              <div className="mt-[10px] py-[10px] px-[12px] rounded-[10px] text-[11.5px] text-[#FCA5A5] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)]">
                {aiError}
              </div>
            )}

            {aiHtml && (
              <div className="mt-[16px] flex flex-col gap-[8px]">
                {aiSlides.length > 1 && (
                  <div className="flex items-center justify-between py-[8px] px-[10px] rounded-[10px] bg-[rgba(94,230,222,0.06)] border border-[rgba(94,230,222,0.18)]">
                    <button
                      onClick={() => setAiSlideIndex(i => Math.max(0, i - 1))}
                      disabled={aiSlideIndex === 0}
                      className="w-[26px] h-[26px] flex items-center justify-center rounded-[6px] bg-[rgba(255,255,255,0.05)] text-[#5EE6DE] hover:bg-[rgba(255,255,255,0.1)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-[14px] font-bold"
                    >‹</button>
                    <div className="flex items-center gap-[5px]">
                      {aiSlides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setAiSlideIndex(i)}
                          className={`transition-all rounded-full cursor-pointer ${i === aiSlideIndex ? "w-[18px] h-[6px] bg-[#5EE6DE]" : "w-[6px] h-[6px] bg-[rgba(94,230,222,0.3)] hover:bg-[rgba(94,230,222,0.5)]"}`}
                          title={`Slide ${i + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setAiSlideIndex(i => Math.min(aiSlides.length - 1, i + 1))}
                      disabled={aiSlideIndex >= aiSlides.length - 1}
                      className="w-[26px] h-[26px] flex items-center justify-center rounded-[6px] bg-[rgba(255,255,255,0.05)] text-[#5EE6DE] hover:bg-[rgba(255,255,255,0.1)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-[14px] font-bold"
                    >›</button>
                  </div>
                )}
                <button
                  onClick={handleAIOpen}
                  className="w-full flex items-center justify-center gap-[8px] py-[10px] px-[14px] rounded-[10px] text-[12px] font-semibold bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#E2E8F0] hover:bg-[rgba(255,255,255,0.07)] cursor-pointer transition-all"
                >
                  <ExternalLink className="w-[13px] h-[13px]" />
                  Open {aiSlides.length > 1 ? `slide ${aiSlideIndex + 1}` : ""} in new tab
                </button>
                <div className="grid grid-cols-3 gap-[6px]">
                  {([
                    { id: "png", label: "PNG" },
                    { id: "jpeg", label: "JPEG" },
                    { id: "pdf", label: "PDF" },
                  ] as const).map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => opt.id === "pdf" ? handleAIDownloadPdf() : handleAIDownloadImage(opt.id)}
                      disabled={!!aiExporting}
                      className="flex items-center justify-center gap-[6px] py-[10px] rounded-[10px] text-[11.5px] font-bold bg-[rgba(0,178,169,0.1)] border border-[rgba(0,178,169,0.3)] text-[#5EE6DE] hover:bg-[rgba(0,178,169,0.18)] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-wait"
                    >
                      {aiExporting === opt.id ? (
                        <Loader2 className="w-[12px] h-[12px] animate-spin" />
                      ) : (
                        <DownloadIcon className="w-[12px] h-[12px]" />
                      )}
                      {opt.label}
                    </button>
                  ))}
                </div>
                {aiSlides.length > 1 && (
                  <div className="grid grid-cols-2 gap-[6px]">
                    <button
                      onClick={handleAIDownloadAllPng}
                      disabled={!!aiExporting}
                      className="flex items-center justify-center gap-[6px] py-[10px] rounded-[10px] text-[11.5px] font-bold bg-[rgba(40,150,251,0.1)] border border-[rgba(40,150,251,0.3)] text-[#7CC8FF] hover:bg-[rgba(40,150,251,0.18)] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-wait"
                    >
                      {aiExporting === "png" && aiExportAllProgress ? (
                        <><Loader2 className="w-[12px] h-[12px] animate-spin" />{aiExportAllProgress.done}/{aiExportAllProgress.total}</>
                      ) : (
                        <><DownloadIcon className="w-[12px] h-[12px]" />All PNGs</>
                      )}
                    </button>
                    <button
                      onClick={handleAIDownloadAllPdf}
                      disabled={!!aiExporting}
                      className="flex items-center justify-center gap-[6px] py-[10px] rounded-[10px] text-[11.5px] font-bold bg-[rgba(255,195,40,0.1)] border border-[rgba(255,195,40,0.3)] text-[#FFC328] hover:bg-[rgba(255,195,40,0.18)] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-wait"
                    >
                      {aiExporting === "pdf" && aiExportAllProgress ? (
                        <><Loader2 className="w-[12px] h-[12px] animate-spin" />{aiExportAllProgress.done}/{aiExportAllProgress.total}</>
                      ) : (
                        <><DownloadIcon className="w-[12px] h-[12px]" />All as PDF</>
                      )}
                    </button>
                  </div>
                )}
                <button
                  onClick={handleAIDownloadHtml}
                  className="w-full flex items-center justify-center gap-[8px] py-[8px] px-[14px] rounded-[10px] text-[11px] font-semibold bg-transparent border border-[rgba(255,255,255,0.06)] text-[#64748B] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#94A3B8] cursor-pointer transition-all"
                >
                  <DownloadIcon className="w-[12px] h-[12px]" />
                  Download HTML source {aiSlides.length > 1 ? `(slide ${aiSlideIndex + 1})` : ""}
                </button>
                <div className="text-[10.5px] text-[#475569] text-center mt-[2px]">Exports render at native canvas resolution.</div>
              </div>
            )}
          </>
        ) : (
        <>
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

        {activeTemplate && (
          <div className="mt-auto pt-[16px]">
            <DownloadButton onExport={handleExport} isExporting={isExporting} label="Download Current" />
          </div>
        )}
        </>
        )}
      </div>

      <LivePreview>
        <div className="flex-1 flex items-center justify-center relative overflow-hidden w-full">
          {aiMode ? (
            aiLoading ? (
              <div
                className="relative w-full max-w-[600px] mx-auto overflow-hidden rounded-[12px]"
                style={{
                  aspectRatio: aiAspectRatio,
                  boxShadow: "0 8px 50px rgba(0,0,0,0.4)",
                  background: "radial-gradient(120% 80% at 30% 20%, #142244 0%, #0B1426 60%, #060B18 100%)",
                  border: "1px solid rgba(94,230,222,0.18)",
                }}
              >
                <motion.div
                  className="absolute rounded-full pointer-events-none"
                  style={{ width: "55%", aspectRatio: "1", left: "5%", top: "10%", background: "radial-gradient(closest-side, rgba(40,150,251,0.55), rgba(40,150,251,0) 70%)", filter: "blur(20px)" }}
                  animate={{ x: ["0%", "12%", "-6%", "0%"], y: ["0%", "-8%", "10%", "0%"], scale: [1, 1.1, 0.95, 1] }}
                  transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute rounded-full pointer-events-none"
                  style={{ width: "50%", aspectRatio: "1", right: "0%", top: "30%", background: "radial-gradient(closest-side, rgba(94,230,222,0.55), rgba(94,230,222,0) 70%)", filter: "blur(20px)" }}
                  animate={{ x: ["0%", "-10%", "8%", "0%"], y: ["0%", "12%", "-8%", "0%"], scale: [1, 0.92, 1.08, 1] }}
                  transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute rounded-full pointer-events-none"
                  style={{ width: "45%", aspectRatio: "1", left: "20%", bottom: "0%", background: "radial-gradient(closest-side, rgba(255,195,40,0.45), rgba(255,195,40,0) 70%)", filter: "blur(20px)" }}
                  animate={{ x: ["0%", "8%", "-12%", "0%"], y: ["0%", "-10%", "6%", "0%"], scale: [1, 1.06, 0.94, 1] }}
                  transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-[18px] z-[3] px-[24px]">
                  <div className="relative" style={{ width: "min(46%, 260px)", aspectRatio: "1" }}>
                    {[
                      { size: 100, dur: 14, dir: 1, dots: 8, color: "#5EE6DE", op: 0.85 },
                      { size: 78, dur: 10, dir: -1, dots: 6, color: "#2896FB", op: 0.9 },
                      { size: 56, dur: 7, dir: 1, dots: 5, color: "#FFC328", op: 0.95 },
                    ].map((ring, ri) => (
                      <motion.div
                        key={ri}
                        className="absolute inset-0 m-auto"
                        style={{ width: `${ring.size}%`, height: `${ring.size}%`, borderRadius: "50%", border: `1px solid ${ring.color}33` }}
                        animate={{ rotate: ring.dir * 360 }}
                        transition={{ duration: ring.dur, repeat: Infinity, ease: "linear" }}
                      >
                        {Array.from({ length: ring.dots }).map((_, di) => {
                          const angle = (di / ring.dots) * Math.PI * 2;
                          const r = 50;
                          const cx = 50 + Math.cos(angle) * r;
                          const cy = 50 + Math.sin(angle) * r;
                          return (
                            <span
                              key={di}
                              className="absolute"
                              style={{
                                left: `${cx}%`, top: `${cy}%`,
                                width: 8, height: 8,
                                marginLeft: -4, marginTop: -4,
                                borderRadius: "50%",
                                background: ring.color,
                                opacity: ring.op,
                                boxShadow: `0 0 12px ${ring.color}, 0 0 22px ${ring.color}`,
                              }}
                            />
                          );
                        })}
                      </motion.div>
                    ))}
                    <motion.div
                      className="absolute inset-0 m-auto flex items-center justify-center"
                      style={{
                        width: "32%", height: "32%",
                        borderRadius: "50%",
                        background: "radial-gradient(closest-side, rgba(255,255,255,0.12), rgba(11,20,38,0.95))",
                        border: "1px solid rgba(94,230,222,0.4)",
                        boxShadow: "0 0 60px rgba(40,150,251,0.45), inset 0 0 30px rgba(94,230,222,0.18)",
                      }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Sparkles className="w-[40%] h-[40%] text-[#5EE6DE]" />
                    </motion.div>
                  </div>
                  <div className="flex flex-col items-center gap-[6px] pointer-events-none">
                    <span className="text-[8.5px] font-bold tracking-[0.28em] text-[#5EE6DE]/70 uppercase">Did you know</span>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={aiLoadingFact}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                        className="text-[12.5px] leading-[1.45] text-[#CBD5E1]/85 font-light italic text-center max-w-[440px]"
                      >
                        {AI_LOADING_FACTS[aiLoadingFact]}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                <div className="absolute top-[14px] right-[14px] flex items-center gap-[8px] py-[7px] px-[12px] rounded-[999px] bg-[rgba(0,0,0,0.55)] backdrop-blur-[10px] border border-[rgba(94,230,222,0.4)] z-[10]">
                  <span className="relative flex w-[8px] h-[8px]">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#5EE6DE] opacity-70 animate-ping" />
                    <span className="relative inline-flex rounded-full w-[8px] h-[8px] bg-[#5EE6DE]" />
                  </span>
                  <span className="text-[11px] font-bold tracking-[0.14em] text-[#5EE6DE]">GENERATING</span>
                </div>

                <div className="absolute bottom-[14px] left-[14px] right-[14px] z-[10]">
                  <div className="relative h-[3px] w-full rounded-full overflow-hidden bg-[rgba(255,255,255,0.06)]">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ background: "linear-gradient(90deg, #2896FB, #5EE6DE, #FFC328)", boxShadow: "0 0 10px rgba(94,230,222,0.6)" }}
                      animate={{ width: `${Math.round(aiLoadingProgress * 100)}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                    <motion.div
                      className="absolute inset-y-0 w-[40%] pointer-events-none"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)" }}
                      animate={{ left: ["-40%", "100%"] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </div>
              </div>
            ) : aiHtml ? (
              aiGridView && aiSlides.length > 1 ? (
                <div className="w-full max-w-[920px] mx-auto flex flex-col gap-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-[0.14em] text-[#5EE6DE]">ALL SLIDES ・ {aiSlides.length}</span>
                    <button
                      onClick={() => setAiGridView(false)}
                      className="flex items-center gap-[6px] py-[6px] px-[12px] rounded-[999px] bg-[rgba(0,0,0,0.65)] backdrop-blur-[10px] border border-[rgba(94,230,222,0.35)] text-[11px] font-bold tracking-[0.1em] text-[#5EE6DE] hover:bg-[rgba(94,230,222,0.15)] cursor-pointer"
                    >
                      SINGLE VIEW
                    </button>
                  </div>
                  <div
                    className="grid gap-[12px]"
                    style={{ gridTemplateColumns: `repeat(${aiSlides.length <= 2 ? aiSlides.length : 2}, minmax(0, 1fr))` }}
                  >
                    {aiSlides.map((html, i) => (
                      <button
                        key={i}
                        onClick={() => { setAiSlideIndex(i); setAiGridView(false); }}
                        className={`relative w-full overflow-hidden rounded-[10px] cursor-pointer transition-all hover:scale-[1.01] ${i === aiSlideIndex ? "ring-2 ring-[#5EE6DE]" : "ring-1 ring-[rgba(255,255,255,0.08)]"}`}
                        style={{ aspectRatio: aiAspectRatio, boxShadow: "0 6px 30px rgba(0,0,0,0.35)" }}
                        title={`Open slide ${i + 1}`}
                      >
                        <iframe
                          title={`Slide ${i + 1}`}
                          srcDoc={wrapWithFit(html, aiCanvasDims.w, aiCanvasDims.h)}
                          sandbox="allow-same-origin allow-scripts"
                          className="w-full h-full block border-0 pointer-events-none"
                          style={{ background: "#0B1426" }}
                        />
                        <div className="absolute top-[8px] left-[8px] py-[3px] px-[8px] rounded-[999px] bg-[rgba(0,0,0,0.7)] backdrop-blur-[8px] border border-[rgba(94,230,222,0.25)] text-[9px] font-bold tracking-[0.12em] text-[#5EE6DE]">
                          {i + 1} / {aiSlides.length}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
              <div
                className="relative w-full max-w-[600px] mx-auto overflow-hidden rounded-[12px]"
                style={{ aspectRatio: aiAspectRatio, boxShadow: "0 8px 50px rgba(0,0,0,0.4)" }}
              >
                <iframe
                  ref={aiPreviewIframeRef}
                  title="Claude Design preview"
                  srcDoc={aiEditMode && aiHtml ? wrapWithEditor(aiHtml, aiCanvasDims.w, aiCanvasDims.h) : (aiHtmlScaled ?? aiHtml)}
                  sandbox="allow-same-origin allow-scripts"
                  className="w-full h-full block border-0"
                  style={{ background: "#0B1426" }}
                />
                {aiSlides.length > 1 && (
                  <div className="absolute top-[12px] right-[12px] flex items-center gap-[6px] z-[5]">
                    <button
                      onClick={() => { setAiEditMode(false); setAiGridView(true); }}
                      className="flex items-center gap-[5px] py-[5px] px-[10px] rounded-[999px] bg-[rgba(0,0,0,0.6)] backdrop-blur-[10px] border border-[rgba(94,230,222,0.3)] text-[10px] font-bold tracking-[0.12em] text-[#5EE6DE] hover:bg-[rgba(94,230,222,0.15)] cursor-pointer"
                      title="See all slides at once"
                    >
                      <LayoutGrid className="w-[11px] h-[11px]" /> ALL {aiSlides.length}
                    </button>
                    <div className="py-[5px] px-[10px] rounded-[999px] bg-[rgba(0,0,0,0.6)] backdrop-blur-[10px] border border-[rgba(94,230,222,0.3)]">
                      <span className="text-[10px] font-bold tracking-[0.12em] text-[#5EE6DE]">SLIDE {aiSlideIndex + 1} / {aiSlides.length}</span>
                    </div>
                  </div>
                )}
                <div className="absolute top-[12px] left-[12px] flex items-center gap-[8px] z-[6]">
                  {!aiEditMode ? (
                    <button
                      onClick={() => setAiEditMode(true)}
                      className="flex items-center gap-[6px] py-[6px] px-[12px] rounded-[999px] bg-[rgba(0,0,0,0.65)] backdrop-blur-[10px] border border-[rgba(94,230,222,0.35)] text-[11px] font-bold tracking-[0.1em] text-[#5EE6DE] hover:bg-[rgba(94,230,222,0.15)] cursor-pointer"
                      title="Click any text in the preview to edit it"
                    >
                      <Edit3 className="w-[12px] h-[12px]" /> EDIT
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveInlineEdits}
                        disabled={aiSavingEdits}
                        className="flex items-center gap-[6px] py-[6px] px-[12px] rounded-[999px] bg-[#FFC328] border border-[#FFC328] text-[11px] font-bold tracking-[0.1em] text-[#0B1426] hover:brightness-110 cursor-pointer disabled:opacity-60"
                      >
                        <Save className="w-[12px] h-[12px]" /> {aiSavingEdits ? "SAVING…" : "SAVE EDITS"}
                      </button>
                      <button
                        onClick={() => setAiEditMode(false)}
                        disabled={aiSavingEdits}
                        className="flex items-center gap-[6px] py-[6px] px-[12px] rounded-[999px] bg-[rgba(0,0,0,0.65)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.18)] text-[11px] font-bold tracking-[0.1em] text-[#94A3B8] hover:text-white cursor-pointer disabled:opacity-60"
                      >
                        CANCEL
                      </button>
                      <span className="py-[5px] px-[10px] rounded-[999px] bg-[rgba(0,0,0,0.55)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.08)] text-[10px] tracking-[0.08em] text-[#94A3B8]">Click any text to edit</span>
                    </>
                  )}
                </div>
              </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center gap-[10px] text-center max-w-[420px] px-[20px]">
                <div className="w-[56px] h-[56px] rounded-[16px] flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, rgba(0,178,169,0.18), rgba(40,150,251,0.14))", border: "1px solid rgba(0,178,169,0.3)" }}>
                  <Sparkles className="w-[24px] h-[24px] text-[#5EE6DE]" />
                </div>
                <div className="text-[16px] font-bold text-white">Claude Design</div>
                <div className="text-[12.5px] text-[#64748B] leading-[1.5]">
                  Describe the design you need in the sidebar and click <span className="text-[#94A3B8] font-semibold">Generate Design</span>. Claude is briefed on the HighLevel brand — colors, typography, voice, and layout.
                </div>
              </div>
            )
          ) : (
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
                className={`relative w-full max-w-[680px] mx-auto overflow-hidden z-[2] ${dragging ? 'cursor-grabbing' : ''}`}
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
                  <div className="w-[1px] h-[20px] bg-[rgba(255,255,255,0.1)] mx-[2px]" />
                  <motion.button
                    onClick={() => setShowLogoOverlay(!showLogoOverlay)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title={showLogoOverlay ? "Hide HL Logo" : "Add HL Logo"}
                    className={`flex items-center gap-[5px] py-[6px] px-[10px] rounded-[8px] cursor-pointer transition-all text-[10px] font-medium
                      ${showLogoOverlay
                        ? 'bg-[rgba(0,178,169,0.2)] text-[#00B2A9]'
                        : 'text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]'
                      }`}
                  >
                    <Stamp className="w-[13px] h-[13px]" />
                    Logo
                  </motion.button>
                  {showLogoOverlay && (
                    <div className="flex items-center gap-[4px] ml-[4px] pl-[8px] border-l border-[rgba(255,255,255,0.1)]">
                      {([
                        { id: "top-left" as const, label: "TL", title: "Top Left" },
                        { id: "bottom-left" as const, label: "BL", title: "Bottom Left" },
                      ]).map(p => (
                        <button
                          key={p.id}
                          onClick={() => setLogoPlacement(p.id)}
                          title={p.title}
                          className={`px-[6px] py-[3px] rounded-[5px] text-[9px] font-semibold cursor-pointer transition-all
                            ${logoPlacement === p.id
                              ? "bg-[rgba(0,178,169,0.25)] text-[#00B2A9]"
                              : "text-[rgba(255,255,255,0.45)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]"
                            }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
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
          )}
        </div>
      </LivePreview>
    </div>
  );
}
