import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Sparkles, ArrowUp, Loader2, Copy, Check, Wand2, FileText, MessageSquare, Lightbulb,
  Paperclip, X, Image as ImageIcon, FileType2, Globe, AlertCircle, Plus, Trash2, FolderOpen,
  Square, RectangleVertical, RectangleHorizontal, ChevronDown, Download,
} from "lucide-react";
import {
  listProjects, createProject, deleteProject, renameProject, updateProjectMessages,
  getActiveProjectId, setActiveProjectId, autoNameFromMessage, PROJECTS_EVENT,
  type BrandBrainProject, type StoredMessage,
} from "./brandBrainStore";

// ─────────────────────────────────────────────────────────────────────────────
// Types

type AttachmentKind = "image" | "pdf" | "text" | "gdoc";

interface Attachment {
  id: string;
  kind: AttachmentKind;
  name: string;
  size?: number;
  base64?: string;
  mediaType?: string;
  previewUrl?: string;
  text?: string;
  docImages?: Array<{ mediaType: string; data: string }>;
  loading?: boolean;
  error?: string;
}

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; mediaType: string; data: string }
  | { type: "document"; mediaType: string; data: string; name?: string };

type FormatKey = "square" | "portrait" | "horizontal";

interface AssetRequest {
  concept?: string;
  headline?: string;
  subline?: string;
  cta?: string;
  visual?: string;
  human?: string;
  supporting?: string;
  suggestedFormats: FormatKey[];
  raw: string;
}

interface GeneratedAsset {
  format: FormatKey;
  status: "queued" | "generating" | "done" | "error";
  html?: string;
  error?: string;
  refineHistory?: string[];
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  attachments?: Attachment[];
  generatedAssets?: GeneratedAsset[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_TEXT_BYTES = 2 * 1024 * 1024;
const TEXT_EXT = /\.(txt|md|markdown|json|csv|tsv|html?|xml|yaml|yml|log|js|ts|jsx|tsx|css|sql|py)$/i;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const GDOC_RE = /https?:\/\/(?:docs|drive)\.google\.com\/(?:document\/d|file\/d|open\?id=)\/?([a-zA-Z0-9_-]{20,})/gi;

const FORMAT_META: Record<FormatKey, { label: string; ratio: string; aspect: string; w: number; h: number; Icon: typeof Square }> = {
  square:     { label: "Square",     ratio: "1:1",     aspect: "1080x1080", w: 1080, h: 1080, Icon: Square },
  portrait:   { label: "Portrait",   ratio: "9:16",    aspect: "1080x1920", w: 1080, h: 1920, Icon: RectangleVertical },
  horizontal: { label: "Horizontal", ratio: "1.91:1",  aspect: "1200x628",  w: 1200, h: 628,  Icon: RectangleHorizontal },
};

function uid() { return Math.random().toString(36).slice(2, 10); }
function fmtBytes(b?: number) {
  if (b === undefined || b === null) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsText(file);
  });
}
function findGoogleDocUrls(text: string): string[] {
  const urls = new Set<string>();
  let m: RegExpExecArray | null;
  GDOC_RE.lastIndex = 0;
  while ((m = GDOC_RE.exec(text)) !== null) urls.add(m[0]);
  return [...urls];
}

// ─────────────────────────────────────────────────────────────────────────────
// Asset request parsing

function parseAssetRequest(text: string): AssetRequest | null {
  const m = text.match(/<asset_set_request>([\s\S]*?)<\/asset_set_request>/i);
  if (!m) return null;
  const raw = m[1].trim();
  const get = (key: string) => {
    const re = new RegExp(`^\\s*${key}\\s*:\\s*(.+?)\\s*$`, "im");
    const r = raw.match(re);
    return r ? r[1].replace(/^["']|["']$/g, "").trim() : undefined;
  };
  const formatsRaw = (get("Suggested formats") || "square, portrait, horizontal").toLowerCase();
  const suggestedFormats: FormatKey[] = [];
  if (/square|1:1/.test(formatsRaw)) suggestedFormats.push("square");
  if (/portrait|9:16|story/.test(formatsRaw)) suggestedFormats.push("portrait");
  if (/horizontal|landscape|1\.91|16:9/.test(formatsRaw)) suggestedFormats.push("horizontal");
  if (suggestedFormats.length === 0) suggestedFormats.push("square", "portrait", "horizontal");
  return {
    concept: get("Concept"),
    headline: get("Headline"),
    subline: get("Subline"),
    cta: get("CTA"),
    visual: get("Visual direction"),
    human: get("Human in shot"),
    supporting: get("Supporting graphics"),
    suggestedFormats,
    raw,
  };
}

function stripAssetRequest(text: string): string {
  return text.replace(/<asset_set_request>[\s\S]*?<\/asset_set_request>/gi, "").trim();
}

// Per-format composition guidance — tells the design model how to lay things out
// for the specific aspect ratio so we never end up with half-empty canvases.
const COMPOSITION_HINTS: Record<FormatKey, string> = {
  square:
    "SQUARE 1080×1080 — Use the full frame. Split layout: headline + CTA on the LEFT 55% (large bold type, accent color on hero word), supporting graphics + product UI on the RIGHT 45%. If a human is in shot, place them right side bleeding off the edge with the supporting product UI floating beside them. HighLevel wordmark top-left or bottom-left.",
  portrait:
    "PORTRAIT 1080×1920 — Vertical stack. Top third: eyebrow tag + HighLevel wordmark. Middle third: massive headline (taking ~60% of width, accent color on hero word) + subline. Bottom third: hero visual (human, product UI mockup, or both composed together) with the CTA pill button anchored bottom-center. Every band must contain content — no blank vertical gaps.",
  horizontal:
    "HORIZONTAL 1200×628 (Twitter/LinkedIn/Meta) — Wide cinematic split. LEFT 50%: headline (3 lines max, large), subline below, CTA pill button. RIGHT 50%: hero visual that fills the full height — a tall product mockup, an angled dashboard screenshot, or a person+product composition. HighLevel wordmark bottom-left. The right half must be visually loaded — never just gradient.",
};

function buildCraftPrompt(req: AssetRequest, format: FormatKey): string {
  const meta = FORMAT_META[format];
  const lines: string[] = [];
  lines.push(`# Asset spec — ${meta.label} ${meta.ratio} (canvas ${meta.aspect})`);
  lines.push("");
  lines.push(`## Composition guidance for this aspect`);
  lines.push(COMPOSITION_HINTS[format]);
  lines.push("");
  if (req.concept) { lines.push(`## Concept`); lines.push(req.concept); lines.push(""); }
  lines.push(`## Copy (use EXACTLY as written, do not paraphrase)`);
  if (req.headline) lines.push(`- Headline: "${req.headline}"`);
  if (req.subline && req.subline.toLowerCase() !== "none") lines.push(`- Subline: "${req.subline}"`);
  if (req.cta && req.cta.toLowerCase() !== "none") lines.push(`- CTA button label: "${req.cta}"`);
  lines.push("");
  if (req.visual) { lines.push(`## Visual direction`); lines.push(req.visual); lines.push(""); }
  if (req.supporting) { lines.push(`## Supporting graphics (must fill the opposite side from the headline)`); lines.push(req.supporting); lines.push(""); }
  if (req.human && req.human.toLowerCase().startsWith("yes")) {
    lines.push(`## Human in shot`);
    lines.push(req.human.replace(/^yes\s*[—-]?\s*/i, ""));
    lines.push("");
  }
  lines.push(`## Brand system (HARD requirements — apply every time)`);
  lines.push(`- Colors: navy #0B1426 surfaces/text, blue #2896FB primary accent, green #17D94B success/CTA accent, yellow #FFC328 warning/highlight, white #FFFFFF base.`);
  lines.push(`- Type: bold sans-serif (Inter Tight / Geist family). One hero word in accent color, the rest white or navy. Tight tracking on display sizes.`);
  lines.push(`- Aesthetic: modern SaaS / Apple keynote calm. Generous whitespace inside content blocks but the canvas as a whole MUST be balanced — never half empty.`);
  lines.push(`- Always include the HighLevel wordmark in a corner (top-left or bottom-left).`);
  lines.push(`- The CTA must be a real pill-shaped button — blue #2896FB or green #17D94B background, white text, with a → arrow.`);
  lines.push("");
  lines.push(`## Final check before rendering`);
  lines.push(`Look at the composition: is the canvas evenly weighted? If one side is empty, ADD content there per the supporting graphics field. Use the FULL canvas.`);
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown rendering

function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let i = 0;
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > i) out.push(text.slice(i, m.index));
    if (m[2]) out.push(<strong key={key++} className="text-white font-semibold">{m[2]}</strong>);
    else if (m[3]) out.push(<em key={key++} className="italic text-[#E2E8F0]">{m[3]}</em>);
    else if (m[4]) out.push(<code key={key++} className="px-[5px] py-[1px] rounded-[4px] bg-white/[0.06] border border-white/[0.08] text-[#A855F7] text-[12.5px] font-mono">{m[4]}</code>);
    i = m.index + m[0].length;
  }
  if (i < text.length) out.push(text.slice(i));
  return out;
}
function renderMarkdown(text: string): React.ReactNode {
  const blocks = text.split(/\n{2,}/);
  return blocks.map((block, bi) => {
    const lines = block.split("\n");
    const isList = lines.every((l) => /^\s*[-•*]\s+/.test(l) || /^\s*\d+\.\s+/.test(l));
    if (isList) {
      return (
        <ul key={bi} className="list-disc pl-[20px] space-y-[6px] my-[10px] marker:text-[#64748B]">
          {lines.map((l, li) => (
            <li key={li} className="text-[14px] leading-[1.65] text-[#CBD5E1]">{renderInline(l.replace(/^\s*[-•*]\s+|^\s*\d+\.\s+/, ""))}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={bi} className="text-[14px] leading-[1.65] text-[#CBD5E1] my-[10px] first:mt-0 last:mb-0 whitespace-pre-wrap">
        {renderInline(block)}
      </p>
    );
  });
}

const SUGGESTIONS = [
  { icon: Lightbulb, label: "Brainstorm", prompt: "Brainstorm 5 punchy headline options for a webinar called 'AI Funnels for Agency Owners'. Audience is solo agency operators doing $10–50k/mo." },
  { icon: Wand2, label: "Design a set", prompt: "I need a launch graphic for our new AI workflow builder — make me a full set across square, portrait, and horizontal." },
  { icon: FileText, label: "Ingest brand", prompt: "Here are my brand notes — read them and summarize my visual style, voice, and what makes us different in 4 bullets." },
  { icon: MessageSquare, label: "Critique copy", prompt: "Critique this headline and rewrite it 3 ways: 'The Future Of Marketing Is Here — Don't Get Left Behind.'" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component

export function BrandBrainWorkspace({ onSendToCraft }: { onSendToCraft: (prompt: string) => void }) {
  // Project state
  const [projects, setProjects] = useState<BrandBrainProject[]>(() => listProjects());
  const [activeId, setActiveIdState] = useState<string | null>(() => getActiveProjectId());
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  // Chat state (mirror of active project's messages, hydrated from store)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Generation panel state
  const [genPanel, setGenPanel] = useState<{
    open: boolean;
    request?: AssetRequest;
    formats: FormatKey[];
    assets: GeneratedAsset[];
  }>({ open: false, formats: [], assets: [] });

  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ─── Project init / sync ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setProjects(listProjects());
    window.addEventListener(PROJECTS_EVENT, handler);
    return () => window.removeEventListener(PROJECTS_EVENT, handler);
  }, []);

  // Ensure there's always at least one project, and one active.
  useEffect(() => {
    if (projects.length === 0) {
      const p = createProject("Untitled project");
      setProjects([p]);
      setActiveIdState(p.id);
      setMessages([]);
      return;
    }
    if (!activeId || !projects.find((p) => p.id === activeId)) {
      const p = projects[0];
      setActiveIdState(p.id);
      setActiveProjectId(p.id);
      setMessages(p.messages.map(hydrateMessage));
    }
  }, [projects, activeId]);

  // When active project changes, hydrate messages from store.
  useEffect(() => {
    if (!activeId) return;
    const p = projects.find((x) => x.id === activeId);
    if (p) setMessages(p.messages.map(hydrateMessage));
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist messages whenever they change (debounced via requestIdleCallback fallback).
  useEffect(() => {
    if (!activeId) return;
    const stored: StoredMessage[] = messages.map((m) => ({
      role: m.role,
      text: m.text,
      attachments: m.attachments,
      generatedAssets: m.generatedAssets?.map((a) => ({ format: a.format, aspect: FORMAT_META[a.format].aspect, html: a.html, error: a.error })),
      ts: Date.now(),
    }));
    updateProjectMessages(activeId, stored);
  }, [messages, activeId]);

  // ─── Scroll & textarea autosize ────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading]);
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 240) + "px";
  }, [input]);

  // ─── Project handlers ──────────────────────────────────────────────────────
  const switchProject = (id: string) => {
    setActiveIdState(id);
    setActiveProjectId(id);
    setProjectMenuOpen(false);
    setError(null);
    setPendingAttachments([]);
    setGenPanel({ open: false, formats: [], assets: [] });
  };
  const newProject = () => {
    const p = createProject("Untitled project");
    setProjects(listProjects());
    setActiveIdState(p.id);
    setMessages([]);
    setProjectMenuOpen(false);
    setError(null);
    setPendingAttachments([]);
    setGenPanel({ open: false, formats: [], assets: [] });
  };
  const removeProject = (id: string) => {
    if (!confirm("Delete this project? This can't be undone.")) return;
    deleteProject(id);
    setProjects(listProjects());
  };
  const renameActive = () => {
    if (!activeId) return;
    const cur = projects.find((p) => p.id === activeId);
    const name = prompt("Rename project", cur?.name || "");
    if (name && name.trim()) {
      renameProject(activeId, name);
      setProjects(listProjects());
    }
  };

  // ─── Files ─────────────────────────────────────────────────────────────────
  const ingestFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const list = Array.from(files);
    for (const file of list) {
      const id = uid();
      try {
        if (IMAGE_TYPES.includes(file.type)) {
          if (file.size > MAX_IMAGE_BYTES) { setError(`${file.name} is over 5MB`); continue; }
          const base64 = await fileToBase64(file);
          setPendingAttachments((p) => [...p, { id, kind: "image", name: file.name, size: file.size, base64, mediaType: file.type, previewUrl: `data:${file.type};base64,${base64}` }]);
        } else if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
          if (file.size > MAX_PDF_BYTES) { setError(`${file.name} is over 20MB`); continue; }
          const base64 = await fileToBase64(file);
          setPendingAttachments((p) => [...p, { id, kind: "pdf", name: file.name, size: file.size, base64, mediaType: "application/pdf" }]);
        } else if (file.type.startsWith("text/") || TEXT_EXT.test(file.name) || file.type === "application/json") {
          if (file.size > MAX_TEXT_BYTES) { setError(`${file.name} is over 2MB`); continue; }
          const text = await fileToText(file);
          setPendingAttachments((p) => [...p, { id, kind: "text", name: file.name, size: file.size, text }]);
        } else {
          setError(`${file.name}: unsupported type (${file.type || "unknown"})`);
        }
      } catch (e: any) {
        setError(`Failed to read ${file.name}: ${e?.message || "unknown"}`);
      }
    }
  }, []);
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) ingestFiles(e.target.files);
    e.target.value = "";
  };
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) { e.preventDefault(); ingestFiles(files); }
  };
  const removeAttachment = (id: string) => setPendingAttachments((p) => p.filter((a) => a.id !== id));

  // ─── Google Doc fetch ──────────────────────────────────────────────────────
  const fetchGoogleDoc = async (url: string): Promise<{ text: string; images: Array<{ mediaType: string; data: string }>; error?: string }> => {
    try {
      const apiBase = import.meta.env.BASE_URL;
      const res = await fetch(`${apiBase}api/import-doc`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return { text: "", images: [], error: j.error || `Doc fetch failed (${res.status})` };
      return { text: j.text || "", images: Array.isArray(j.images) ? j.images : [] };
    } catch (e: any) { return { text: "", images: [], error: e?.message || "Network error" }; }
  };

  // ─── Send ──────────────────────────────────────────────────────────────────
  const send = useCallback(async (override?: string) => {
    const userText = (override ?? input).trim();
    if (!userText && pendingAttachments.length === 0) return;
    if (loading) return;
    setError(null);

    // Auto-name the project from the first message
    if (activeId && messages.length === 0 && userText) {
      renameProject(activeId, autoNameFromMessage(userText));
      setProjects(listProjects());
    }

    const docUrls = findGoogleDocUrls(userText);
    let docAttachments: Attachment[] = [];
    let nextMessages: ChatMessage[];

    if (docUrls.length > 0) {
      docAttachments = docUrls.map(() => ({ id: uid(), kind: "gdoc" as const, name: "Google Doc", text: "", loading: true }));
      const optimistic: ChatMessage = { role: "user", text: userText, attachments: [...pendingAttachments, ...docAttachments] };
      nextMessages = [...messages, optimistic];
      setMessages(nextMessages);
      setInput("");
      setLoading(true);

      const fetched = await Promise.all(docUrls.map(fetchGoogleDoc));
      docAttachments = docAttachments.map((att, i) => ({ ...att, loading: false, text: fetched[i].text, docImages: fetched[i].images, error: fetched[i].error, size: fetched[i].text.length }));
      const finalUserMsg: ChatMessage = { role: "user", text: userText, attachments: [...pendingAttachments, ...docAttachments] };
      nextMessages = [...messages, finalUserMsg];
      setMessages(nextMessages);
    } else {
      const userMsg: ChatMessage = { role: "user", text: userText, attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined };
      nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setLoading(true);
    }

    setPendingAttachments([]);

    try {
      const wireMessages = nextMessages.map((msg) => {
        if (msg.role === "assistant") return { role: "assistant", content: msg.text };
        const blocks: ContentBlock[] = [];
        for (const att of msg.attachments || []) {
          if (att.kind === "text" && att.text) blocks.push({ type: "text", text: `📎 Attached file: ${att.name}\n\n---\n${att.text}\n---` });
          else if (att.kind === "gdoc") {
            if (att.error) blocks.push({ type: "text", text: `⚠️ Google Doc fetch failed: ${att.error}` });
            else if (att.text) {
              const imgNote = att.docImages && att.docImages.length > 0 ? ` (${att.docImages.length} embedded image${att.docImages.length === 1 ? "" : "s"} attached below)` : "";
              blocks.push({ type: "text", text: `📄 Google Doc contents${imgNote}:\n\n---\n${att.text}\n---` });
            }
          }
        }
        for (const att of msg.attachments || []) {
          if (att.kind === "image" && att.base64 && att.mediaType) blocks.push({ type: "image", mediaType: att.mediaType, data: att.base64 });
          else if (att.kind === "gdoc" && att.docImages) for (const img of att.docImages) blocks.push({ type: "image", mediaType: img.mediaType, data: img.data });
        }
        for (const att of msg.attachments || []) {
          if (att.kind === "pdf" && att.base64 && att.mediaType) blocks.push({ type: "document", mediaType: att.mediaType, data: att.base64, name: att.name });
        }
        if (msg.text) blocks.push({ type: "text", text: msg.text });
        if (blocks.length === 0) blocks.push({ type: "text", text: "(no text)" });
        return { role: "user", content: blocks };
      });

      const apiBase = import.meta.env.BASE_URL;
      const res = await fetch(`${apiBase}api/brand-brain`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: wireMessages }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.text || "(no response)" }]);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, pendingAttachments, activeId]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };
  const handleCopy = async (id: number, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1400); } catch {}
  };

  // ─── Asset set generation ─────────────────────────────────────────────────
  const openGenPanel = (request: AssetRequest) => {
    setGenPanel({ open: true, request, formats: [...request.suggestedFormats], assets: [] });
  };
  const toggleFormat = (f: FormatKey) => {
    setGenPanel((g) => ({ ...g, formats: g.formats.includes(f) ? g.formats.filter((x) => x !== f) : [...g.formats, f] }));
  };
  const closeGenPanel = () => setGenPanel((g) => ({ ...g, open: false }));

  const updateAsset = useCallback((format: FormatKey, patch: Partial<GeneratedAsset>) => {
    setGenPanel((g) => ({ ...g, assets: g.assets.map((a) => (a.format === format ? { ...a, ...patch } : a)) }));
    // Also persist to the message history so reloads remember the refined version.
    setMessages((m) => {
      const copy = [...m];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === "assistant" && copy[i].generatedAssets) {
          copy[i] = {
            ...copy[i],
            generatedAssets: copy[i].generatedAssets!.map((a) => (a.format === format ? { ...a, ...patch } : a)),
          };
          break;
        }
      }
      return copy;
    });
  }, []);

  const generateSet = async () => {
    const req = genPanel.request;
    const targetFormats = genPanel.formats;
    if (!req || targetFormats.length === 0) return;
    const initial: GeneratedAsset[] = targetFormats.map((f) => ({ format: f, status: "queued" }));
    setGenPanel((g) => ({ ...g, assets: initial }));

    const apiBase = import.meta.env.BASE_URL;
    const results: GeneratedAsset[] = [];
    await Promise.all(targetFormats.map(async (format) => {
      setGenPanel((g) => ({ ...g, assets: g.assets.map((a) => a.format === format ? { ...a, status: "generating" } : a) }));
      let result: GeneratedAsset;
      try {
        // We build a rich, format-aware designer brief client-side from Brand Brain's
        // structured output and ship it straight to claude-design. We deliberately
        // skip /polish-prompt — that endpoint is built for one-line user ideas and
        // adds generic SaaS noise on top of an already-detailed concept, which was
        // producing half-empty / unbalanced layouts.
        const designPrompt = buildCraftPrompt(req, format);
        const res = await fetch(`${apiBase}api/claude-design`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: designPrompt,
            aspect: FORMAT_META[format].aspect,
            model: "claude-sonnet-4-6",
            slideCount: 1,
            hasItem: false,
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Generation failed (${res.status})`);
        }
        const data = await res.json();
        result = { format, status: "done", html: data.html };
      } catch (e: any) {
        result = { format, status: "error", error: e?.message || "Failed" };
      }
      results.push(result);
      setGenPanel((g) => ({ ...g, assets: g.assets.map((a) => a.format === format ? result : a) }));
    }));

    // Persist generated assets to the latest assistant message in the project.
    setMessages((m) => {
      const copy = [...m];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === "assistant") {
          copy[i] = { ...copy[i], generatedAssets: results };
          break;
        }
      }
      return copy;
    });
  };

  const isEmpty = messages.length === 0;
  const canSend = (input.trim().length > 0 || pendingAttachments.length > 0) && !loading;
  const activeProject = projects.find((p) => p.id === activeId);

  // ─── Drag and drop ────────────────────────────────────────────────────────
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer?.files?.length) ingestFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden relative">
      {/* Left: chat */}
      <div
        className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0"
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      >
        {/* Aurora */}
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.10),transparent_70%)] blur-3xl" />
          <div className="absolute bottom-[-300px] right-[-100px] w-[700px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(40,150,251,0.08),transparent_70%)] blur-3xl" />
        </div>

        {/* Drop overlay */}
        {dragOver && (
          <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-[rgba(11,20,38,0.85)] backdrop-blur-sm">
            <div className="px-[28px] py-[22px] rounded-[18px] border-2 border-dashed border-[#A855F7] bg-[rgba(168,85,247,0.12)] text-[#E9D5FF] text-[15px] font-semibold flex items-center gap-[12px]">
              <Paperclip className="w-[18px] h-[18px]" />
              Drop images, PDFs, or text files
            </div>
          </div>
        )}

        <input ref={fileInputRef} type="file" multiple hidden accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf,text/*,.md,.markdown,.json,.csv,.tsv,.html,.htm,.xml,.yaml,.yml,.log,.js,.ts,.jsx,.tsx,.css,.sql,.py" onChange={handleFilePick} />

        {/* Project header */}
        <div className="shrink-0 relative z-[2] flex items-center gap-[10px] px-[20px] md:px-[28px] py-[12px] border-b border-white/[0.05] bg-[rgba(11,20,38,0.6)] backdrop-blur-md">
          <div className="relative">
            <button
              onClick={() => setProjectMenuOpen((o) => !o)}
              className="flex items-center gap-[8px] px-[12px] py-[7px] rounded-[10px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[13px] text-white transition-all cursor-pointer max-w-[280px]"
            >
              <FolderOpen className="w-[13px] h-[13px] text-[#A855F7] shrink-0" />
              <span className="truncate font-semibold">{activeProject?.name || "Project"}</span>
              <ChevronDown className={`w-[12px] h-[12px] text-[#94A3B8] transition-transform ${projectMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {projectMenuOpen && (
              <>
                <div className="fixed inset-0 z-[40]" onClick={() => setProjectMenuOpen(false)} />
                <div className="absolute top-full mt-[6px] left-0 z-[50] w-[300px] rounded-[12px] bg-[#0B1426] border border-white/[0.08] shadow-[0_18px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                  <button onClick={newProject} className="w-full flex items-center gap-[10px] px-[14px] py-[11px] text-[13px] text-white hover:bg-white/[0.05] transition-colors cursor-pointer border-b border-white/[0.05]">
                    <Plus className="w-[14px] h-[14px] text-[#A855F7]" />
                    <span className="font-semibold">New project</span>
                  </button>
                  <div className="max-h-[360px] overflow-y-auto sidebar-scroll">
                    {projects.map((p) => (
                      <div key={p.id} className={`group flex items-center gap-[8px] px-[14px] py-[10px] hover:bg-white/[0.04] transition-colors cursor-pointer ${p.id === activeId ? "bg-white/[0.03]" : ""}`}>
                        <button onClick={() => switchProject(p.id)} className="flex-1 text-left min-w-0 cursor-pointer">
                          <div className="text-[12.5px] text-white truncate font-medium">{p.name}</div>
                          <div className="text-[10.5px] text-[#64748B] mt-[1px]">{p.messages.length} {p.messages.length === 1 ? "message" : "messages"} · {timeAgo(p.updatedAt)}</div>
                        </button>
                        <button onClick={() => removeProject(p.id)} className="opacity-0 group-hover:opacity-100 p-[5px] rounded-[6px] text-[#64748B] hover:text-[#EF4444] hover:bg-white/[0.05] transition-all cursor-pointer">
                          <Trash2 className="w-[12px] h-[12px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <button onClick={renameActive} title="Rename" className="text-[11px] text-[#64748B] hover:text-white transition-colors cursor-pointer">Rename</button>
          <div className="ml-auto text-[10.5px] text-[#475569]">{messages.length} {messages.length === 1 ? "msg" : "msgs"} · saved locally</div>
        </div>

        {/* Scroll area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto sidebar-scroll relative">
          <div className="max-w-[760px] mx-auto px-[24px] md:px-[32px] py-[28px]">
            {isEmpty ? (
              <div className="min-h-[calc(100vh-380px)] flex flex-col items-center justify-center text-center">
                <div className="w-[64px] h-[64px] rounded-[20px] flex items-center justify-center mb-[20px] bg-gradient-to-br from-[#A855F7] via-[#2896FB] to-[#00B2A9] shadow-[0_12px_40px_rgba(168,85,247,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]">
                  <Sparkles className="w-[28px] h-[28px] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]" />
                </div>
                <h1 className="text-[34px] md:text-[40px] font-bold tracking-[-1px] bg-gradient-to-r from-white via-[#E2E8F0] to-white bg-clip-text text-transparent">Brand Brain</h1>
                <p className="text-[15px] text-[#94A3B8] mt-[10px] max-w-[500px]">
                  Drop docs, paste Google Docs, share images. When you're ready, ask for a design and I'll spin up the full set across square, portrait, and horizontal — right here.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] mt-[36px] w-full max-w-[600px]">
                  {SUGGESTIONS.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <button key={i} onClick={() => send(s.prompt)} className="group text-left p-[16px] rounded-[14px] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 cursor-pointer">
                        <div className="flex items-center gap-[10px] mb-[6px]">
                          <Icon className="w-[15px] h-[15px] text-[#A855F7] group-hover:text-[#C084FC] transition-colors" />
                          <span className="text-[12.5px] font-semibold text-white">{s.label}</span>
                        </div>
                        <div className="text-[12.5px] text-[#94A3B8] leading-[1.5] line-clamp-2">{s.prompt}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-[28px] pb-[40px]">
                {messages.map((m, i) => {
                  const req = m.role === "assistant" ? parseAssetRequest(m.text) : null;
                  const display = req ? stripAssetRequest(m.text) : m.text;
                  return (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      {m.role === "user" ? (
                        <div className="max-w-[85%] flex flex-col items-end gap-[8px]">
                          {m.attachments && m.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-[8px] justify-end">
                              {m.attachments.map((att) => <AttachmentChip key={att.id} att={att} dark />)}
                            </div>
                          )}
                          {m.text && (
                            <div className="px-[16px] py-[12px] rounded-[18px] rounded-br-[6px] bg-gradient-to-br from-[rgba(40,150,251,0.18)] to-[rgba(168,85,247,0.14)] border border-[rgba(40,150,251,0.25)] text-[14px] text-white whitespace-pre-wrap leading-[1.55]">
                              {m.text}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="max-w-[100%] flex gap-[12px] w-full">
                          <div className="w-[28px] h-[28px] rounded-[9px] flex items-center justify-center shrink-0 bg-gradient-to-br from-[#A855F7] via-[#2896FB] to-[#00B2A9] shadow-[0_4px_14px_rgba(168,85,247,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] mt-[2px]">
                            <Sparkles className="w-[13px] h-[13px] text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {display && <div className="text-[#CBD5E1]">{renderMarkdown(display)}</div>}

                            {req && (
                              <AssetRequestCard
                                req={req}
                                onOpenPanel={() => openGenPanel(req)}
                                onCopy={() => handleCopy(i, buildCraftPrompt(req, "square"))}
                                copied={copiedId === i}
                                hasGenerated={!!m.generatedAssets && m.generatedAssets.length > 0}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex gap-[12px] items-center">
                    <div className="w-[28px] h-[28px] rounded-[9px] flex items-center justify-center shrink-0 bg-gradient-to-br from-[#A855F7] via-[#2896FB] to-[#00B2A9] shadow-[0_4px_14px_rgba(168,85,247,0.3)]">
                      <Sparkles className="w-[13px] h-[13px] text-white animate-pulse" />
                    </div>
                    <div className="flex gap-[5px]">
                      <span className="w-[6px] h-[6px] rounded-full bg-[#A855F7] animate-[bbDot_1.2s_ease-in-out_infinite]" />
                      <span className="w-[6px] h-[6px] rounded-full bg-[#A855F7] animate-[bbDot_1.2s_ease-in-out_infinite] [animation-delay:0.15s]" />
                      <span className="w-[6px] h-[6px] rounded-full bg-[#A855F7] animate-[bbDot_1.2s_ease-in-out_infinite] [animation-delay:0.3s]" />
                    </div>
                  </div>
                )}
                {error && (
                  <div className="rounded-[10px] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] px-[14px] py-[10px] text-[12.5px] text-[#FCA5A5] flex items-start gap-[8px]">
                    <AlertCircle className="w-[14px] h-[14px] mt-[1px] shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="shrink-0 relative z-[1] px-[20px] md:px-[32px] pb-[24px] pt-[12px]">
          <div className="max-w-[760px] mx-auto">
            {pendingAttachments.length > 0 && (
              <div className="mb-[10px] flex flex-wrap gap-[8px]">
                {pendingAttachments.map((att) => <AttachmentChip key={att.id} att={att} onRemove={() => removeAttachment(att.id)} />)}
              </div>
            )}
            <div className="relative rounded-[20px] bg-[#0B1426]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] focus-within:border-[rgba(168,85,247,0.35)] focus-within:shadow-[0_12px_40px_rgba(168,85,247,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-200">
              <textarea
                ref={taRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} onPaste={handlePaste}
                placeholder="Ask anything, paste a Google Doc link, or drop files…"
                rows={1}
                className="w-full bg-transparent resize-none px-[18px] pt-[16px] pb-[8px] text-[14.5px] text-white placeholder:text-[#475569] outline-none leading-[1.5] max-h-[240px]"
              />
              <div className="flex items-center justify-between px-[10px] pb-[10px] pt-[2px] gap-[8px]">
                <button onClick={() => fileInputRef.current?.click()} className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] text-[#94A3B8] hover:text-white transition-all cursor-pointer" title="Attach files">
                  <Paperclip className="w-[15px] h-[15px]" />
                </button>
                <div className="flex-1 text-[10.5px] text-[#475569] tracking-[0.3px] truncate">
                  <span className="hidden sm:inline">Drop, paste, or attach files · </span>Powered by Claude Opus
                </div>
                <button onClick={() => send()} disabled={!canSend} className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center transition-all duration-200 ${canSend ? "bg-gradient-to-br from-[#A855F7] via-[#2896FB] to-[#00B2A9] text-white shadow-[0_6px_18px_rgba(168,85,247,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] hover:brightness-110 cursor-pointer" : "bg-white/[0.04] text-[#475569] cursor-not-allowed"}`}>
                  {loading ? <Loader2 className="w-[15px] h-[15px] animate-spin" /> : <ArrowUp className="w-[15px] h-[15px]" />}
                </button>
              </div>
            </div>
            <div className="text-[10.5px] text-[#475569] text-center mt-[8px]">Brand Brain can make mistakes — sanity-check copy before shipping.</div>
          </div>
        </div>
      </div>

      {/* Right: generation panel */}
      {genPanel.open && (
        <GenerationPanel
          request={genPanel.request!}
          formats={genPanel.formats}
          assets={genPanel.assets}
          onToggleFormat={toggleFormat}
          onGenerate={generateSet}
          onClose={closeGenPanel}
          onSendToCraft={(prompt) => onSendToCraft(prompt)}
          onUpdateAsset={updateAsset}
        />
      )}

      <style>{`
        @keyframes bbDot { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); } 40% { opacity: 1; transform: scale(1.1); } }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Asset request card

function AssetRequestCard({ req, onOpenPanel, onCopy, copied, hasGenerated }: { req: AssetRequest; onOpenPanel: () => void; onCopy: () => void; copied: boolean; hasGenerated: boolean }) {
  return (
    <div className="mt-[16px] rounded-[14px] border border-[rgba(168,85,247,0.25)] bg-gradient-to-br from-[rgba(168,85,247,0.08)] via-[rgba(40,150,251,0.06)] to-[rgba(0,178,169,0.05)] overflow-hidden">
      <div className="px-[16px] py-[12px] border-b border-white/[0.06] flex items-center gap-[10px]">
        <div className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center bg-gradient-to-br from-[#A855F7] to-[#2896FB] shadow-[0_2px_8px_rgba(168,85,247,0.4)]">
          <Wand2 className="w-[11px] h-[11px] text-white" />
        </div>
        <div className="text-[12.5px] font-semibold text-white">Asset Set Concept</div>
        <div className="text-[10px] uppercase tracking-[1.2px] text-[#A855F7] font-semibold ml-auto">{hasGenerated ? "Generated" : "Ready"}</div>
      </div>
      <div className="px-[16px] py-[14px] space-y-[8px] text-[12.5px]">
        {req.concept && <BriefRow label="Concept" value={req.concept} bold />}
        {req.headline && <BriefRow label="Headline" value={`"${req.headline}"`} bold />}
        {req.subline && <BriefRow label="Subline" value={`"${req.subline}"`} />}
        {req.cta && <BriefRow label="CTA" value={req.cta} />}
        {req.visual && <BriefRow label="Visual" value={req.visual} />}
        {req.human && <BriefRow label="Human" value={req.human} />}
        <div className="flex gap-[10px]">
          <div className="w-[64px] shrink-0 text-[10.5px] uppercase tracking-[1px] text-[#64748B] font-semibold pt-[4px]">Formats</div>
          <div className="flex flex-wrap gap-[6px]">
            {req.suggestedFormats.map((f) => {
              const meta = FORMAT_META[f];
              const Icon = meta.Icon;
              return (
                <span key={f} className="inline-flex items-center gap-[6px] px-[9px] py-[4px] rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-[11px] text-[#CBD5E1]">
                  <Icon className="w-[10px] h-[10px] text-[#A855F7]" />
                  {meta.label} <span className="text-[#64748B]">{meta.ratio}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
      <div className="px-[16px] pb-[14px] flex items-center gap-[8px]">
        <button onClick={onOpenPanel} className="flex-1 flex items-center justify-center gap-[8px] py-[10px] px-[14px] rounded-[10px] text-[12.5px] font-semibold bg-gradient-to-br from-[#A855F7] via-[#2896FB] to-[#00B2A9] text-white hover:brightness-110 cursor-pointer shadow-[0_6px_20px_rgba(168,85,247,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all">
          <Wand2 className="w-[13px] h-[13px]" />
          {hasGenerated ? "Open generation panel" : "Pick formats & generate"}
        </button>
        <button onClick={onCopy} className="px-[12px] py-[10px] rounded-[10px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[#94A3B8] hover:text-white transition-all cursor-pointer" title="Copy prompt">
          {copied ? <Check className="w-[13px] h-[13px]" /> : <Copy className="w-[13px] h-[13px]" />}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generation Panel (right-side drawer)

function GenerationPanel({
  request, formats, assets, onToggleFormat, onGenerate, onClose, onSendToCraft, onUpdateAsset,
}: {
  request: AssetRequest;
  formats: FormatKey[];
  assets: GeneratedAsset[];
  onToggleFormat: (f: FormatKey) => void;
  onGenerate: () => void;
  onClose: () => void;
  onSendToCraft: (prompt: string) => void;
  onUpdateAsset: (format: FormatKey, patch: Partial<GeneratedAsset>) => void;
}) {
  const generating = assets.length > 0 && assets.some((a) => a.status === "generating" || a.status === "queued");
  const allDone = assets.length > 0 && assets.every((a) => a.status === "done" || a.status === "error");

  return (
    <div className="hidden md:flex w-[520px] lg:w-[600px] xl:w-[680px] shrink-0 flex-col h-full border-l border-white/[0.06] bg-[#0A1220] relative z-[3]">
      {/* Header */}
      <div className="shrink-0 px-[18px] py-[14px] border-b border-white/[0.06] flex items-center gap-[10px]">
        <div className="w-[26px] h-[26px] rounded-[8px] flex items-center justify-center bg-gradient-to-br from-[#00B2A9] via-[#2896FB] to-[#A855F7] shadow-[0_4px_12px_rgba(40,150,251,0.35)]">
          <Wand2 className="w-[13px] h-[13px] text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-white truncate">Craft Magic — Asset Set</div>
          <div className="text-[10.5px] text-[#64748B] truncate">{request.concept || request.headline || "Generate full set"}</div>
        </div>
        <button onClick={onClose} className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer">
          <X className="w-[14px] h-[14px]" />
        </button>
      </div>

      {/* Format picker */}
      <div className="shrink-0 px-[18px] py-[16px] border-b border-white/[0.06] bg-[rgba(11,20,38,0.6)]">
        <div className="text-[10.5px] uppercase tracking-[1.5px] text-[#64748B] font-semibold mb-[10px]">1. Pick formats</div>
        <div className="grid grid-cols-3 gap-[8px]">
          {(Object.keys(FORMAT_META) as FormatKey[]).map((f) => {
            const meta = FORMAT_META[f];
            const Icon = meta.Icon;
            const active = formats.includes(f);
            return (
              <button
                key={f}
                onClick={() => onToggleFormat(f)}
                disabled={generating}
                className={`p-[10px] rounded-[10px] border transition-all text-left cursor-pointer ${
                  active
                    ? "bg-gradient-to-br from-[rgba(168,85,247,0.15)] to-[rgba(40,150,251,0.10)] border-[rgba(168,85,247,0.4)] shadow-[0_4px_14px_rgba(168,85,247,0.18)]"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                } ${generating ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center justify-between mb-[6px]">
                  <Icon className={`w-[14px] h-[14px] ${active ? "text-[#A855F7]" : "text-[#64748B]"}`} />
                  {active && <Check className="w-[12px] h-[12px] text-[#A855F7]" />}
                </div>
                <div className="text-[12px] font-semibold text-white">{meta.label}</div>
                <div className="text-[10.5px] text-[#64748B]">{meta.ratio}</div>
              </button>
            );
          })}
        </div>
        <button
          onClick={onGenerate}
          disabled={formats.length === 0 || generating}
          className={`mt-[12px] w-full flex items-center justify-center gap-[8px] py-[11px] px-[14px] rounded-[10px] text-[12.5px] font-semibold transition-all ${
            formats.length > 0 && !generating
              ? "bg-gradient-to-br from-[#A855F7] via-[#2896FB] to-[#00B2A9] text-white shadow-[0_6px_18px_rgba(168,85,247,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-110 cursor-pointer"
              : "bg-white/[0.04] text-[#475569] cursor-not-allowed"
          }`}
        >
          {generating ? <><Loader2 className="w-[13px] h-[13px] animate-spin" /> Generating {formats.length} {formats.length === 1 ? "asset" : "assets"}…</> : <><Wand2 className="w-[13px] h-[13px] " /> Generate {formats.length} {formats.length === 1 ? "asset" : "assets"}</>}
        </button>
      </div>

      {/* Asset previews */}
      <div className="flex-1 overflow-y-auto sidebar-scroll px-[18px] py-[16px]">
        {assets.length === 0 ? (
          <div className="text-center text-[12px] text-[#64748B] py-[40px]">
            <Sparkles className="w-[24px] h-[24px] mx-auto mb-[10px] text-[#A855F7] opacity-50" />
            Pick at least one format and hit Generate. They run in parallel.
          </div>
        ) : (
          <div className="space-y-[16px]">
            {assets.map((asset) => (
              <AssetCard
                key={asset.format}
                asset={asset}
                request={request}
                onSendToCraft={() => onSendToCraft(buildCraftPrompt(request, asset.format))}
                onUpdate={(patch) => onUpdateAsset(asset.format, patch)}
              />
            ))}
            {allDone && <div className="text-center text-[11px] text-[#64748B] pt-[8px]">All set. Use Edit to refine inline, or hand off to Craft Magic for the full editor.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function AssetCard({ asset, request, onSendToCraft, onUpdate }: { asset: GeneratedAsset; request: AssetRequest; onSendToCraft: () => void; onUpdate: (patch: Partial<GeneratedAsset>) => void }) {
  const meta = FORMAT_META[asset.format];
  const Icon = meta.Icon;
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const handleRefine = async () => {
    const instruction = editText.trim();
    if (!instruction || !asset.html || refining) return;
    setRefining(true);
    setRefineError(null);
    try {
      const apiBase = import.meta.env.BASE_URL;
      const res = await fetch(`${apiBase}api/refine-design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: asset.html,
          instruction,
          model: "claude-sonnet-4-6",
          aspect: meta.aspect,
          format: "social",
          recentEdits: (asset.refineHistory || []).slice(0, 5),
          slideIndex: 0,
          slideCount: 1,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Refine failed (${res.status})`);
      if (!data.html) throw new Error("Empty response");
      onUpdate({ html: data.html, refineHistory: [instruction, ...(asset.refineHistory || [])].slice(0, 6) });
      setEditText("");
    } catch (e: any) {
      setRefineError(e?.message || "Refine failed");
    } finally {
      setRefining(false);
    }
  };

  const QUICK_EDITS: Array<{ label: string; instruction: string }> = [
    { label: "Bigger headline", instruction: "Make the headline ~30% larger and tighter, keep everything else proportional." },
    { label: "More whitespace", instruction: "Add more breathing room between elements — increase padding and gaps by 30%." },
    { label: "Bolder accent", instruction: "Use a stronger brand-blue accent on the hero word and the CTA button." },
    { label: "Add product UI", instruction: "Add a HighLevel dashboard mockup on the empty side — angled 6° with a soft shadow." },
    { label: "Calm it down", instruction: "Simplify — reduce visual noise, fewer floating elements, focus on the headline and one hero visual." },
  ];

  // Track container width so we can scale the iframe correctly.
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setContainerWidth(e.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Reset ready flag when the html changes
  useEffect(() => { setIframeReady(false); }, [asset.html]);

  const scale = containerWidth > 0 ? containerWidth / meta.w : 0;

  const handleDownload = async () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;
    setDownloading(true);
    try {
      const doc = iframe.contentDocument;
      // Find the design root — claude-design wraps everything in a .canvas div sized to the spec.
      const target = (doc.querySelector(".canvas") as HTMLElement) || (doc.body as HTMLElement);
      // Wait for fonts and images inside the iframe to fully load.
      try { await (doc as any).fonts?.ready; } catch {}
      const imgs = Array.from(target.querySelectorAll("img"));
      await Promise.all(imgs.map((img) => img.complete ? Promise.resolve() : new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); })));

      // Dynamic import keeps initial bundle slim.
      const { toPng } = await import("html-to-image");
      const w = target.offsetWidth || meta.w;
      const h = target.offsetHeight || meta.h;
      const dataUrl = await toPng(target, {
        width: w,
        height: h,
        pixelRatio: 2,
        cacheBust: true,
        skipAutoScale: true,
        backgroundColor: "#0B1426",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `brand-engine-${meta.label.toLowerCase()}-${meta.aspect}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (e) {
      console.error("PNG export failed", e);
      alert("Couldn't generate PNG. Try opening in Craft Magic and exporting from there.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-[12px] border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="px-[12px] py-[8px] border-b border-white/[0.06] flex items-center gap-[8px]">
        <Icon className="w-[12px] h-[12px] text-[#A855F7]" />
        <div className="text-[11.5px] font-semibold text-white">{meta.label}</div>
        <div className="text-[10px] text-[#64748B]">{meta.ratio}</div>
        <div className="ml-auto text-[10px]">
          {asset.status === "queued" && <span className="text-[#64748B]">Queued</span>}
          {asset.status === "generating" && <span className="text-[#A855F7] flex items-center gap-[5px]"><Loader2 className="w-[10px] h-[10px] animate-spin" />Crafting…</span>}
          {asset.status === "done" && <span className="text-[#17D94B]">Done · {meta.w}×{meta.h}</span>}
          {asset.status === "error" && <span className="text-[#EF4444]">Error</span>}
        </div>
      </div>
      <div className="p-[12px] bg-[#050810] flex items-center justify-center">
        <div
          ref={containerRef}
          className="relative bg-[#0B1426] rounded-[6px] overflow-hidden w-full"
          style={{ aspectRatio: `${meta.w}/${meta.h}` }}
        >
          {asset.status === "done" && asset.html && scale > 0 ? (
            <>
              {/* The iframe is rendered at the design's NATURAL size (e.g. 1080x1080) */}
              {/* and CSS-transformed down to fit the container. This way the full design */}
              {/* is visible at the proper aspect, and the underlying DOM still has the */}
              {/* real pixels for export. */}
              <iframe
                ref={iframeRef}
                srcDoc={asset.html}
                title={`${meta.label} preview`}
                sandbox="allow-same-origin"
                onLoad={() => setIframeReady(true)}
                className="absolute top-0 left-0 border-0 pointer-events-none bg-[#0B1426]"
                style={{
                  width: meta.w,
                  height: meta.h,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  opacity: iframeReady ? 1 : 0,
                  transition: "opacity 200ms",
                }}
              />
              {!iframeReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-[20px] h-[20px] text-[#A855F7] animate-spin" />
                </div>
              )}
            </>
          ) : asset.status === "error" ? (
            <div className="absolute inset-0 flex items-center justify-center text-[11px] text-[#FCA5A5] p-[10px] text-center">
              <div>
                <AlertCircle className="w-[16px] h-[16px] mx-auto mb-[4px]" />
                {asset.error || "Generation failed"}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-[8px]">
                <div className="w-[28px] h-[28px] rounded-full border-2 border-[#A855F7]/30 border-t-[#A855F7] animate-spin" />
                <div className="text-[10.5px] text-[#64748B]">{asset.status === "generating" ? "Crafting…" : "Queued"}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      {asset.status === "done" && (
        <div className="px-[12px] pb-[12px] flex flex-col gap-[8px]">
          <div className="flex gap-[6px]">
            <button
              onClick={() => setEditOpen((o) => !o)}
              className={`flex-1 flex items-center justify-center gap-[6px] py-[7px] px-[10px] rounded-[8px] border text-[11px] transition-all cursor-pointer ${
                editOpen
                  ? "bg-gradient-to-br from-[rgba(168,85,247,0.18)] to-[rgba(40,150,251,0.12)] border-[rgba(168,85,247,0.4)] text-white"
                  : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-[#CBD5E1] hover:text-white"
              }`}
            >
              <Wand2 className="w-[10px] h-[10px]" /> {editOpen ? "Close edit" : "Edit"}
            </button>
            <button
              onClick={onSendToCraft}
              title="Open in dedicated Craft Magic editor"
              className="px-[10px] py-[7px] rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#94A3B8] hover:text-white transition-all cursor-pointer text-[11px]"
            >
              Open ↗
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading || !iframeReady}
              className="px-[10px] py-[7px] rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed border border-white/[0.08] text-[#94A3B8] hover:text-white transition-all cursor-pointer flex items-center gap-[5px] text-[11px]"
              title="Download high-res PNG"
            >
              {downloading ? <Loader2 className="w-[11px] h-[11px] animate-spin" /> : <Download className="w-[11px] h-[11px]" />}
              PNG
            </button>
          </div>

          {editOpen && (
            <div className="rounded-[10px] border border-white/[0.08] bg-[#050810] p-[10px] flex flex-col gap-[8px]">
              <div className="flex items-center gap-[6px]">
                <Wand2 className="w-[10px] h-[10px] text-[#17D94B]" />
                <span className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#17D94B]">Refine with AI</span>
                {asset.refineHistory && asset.refineHistory.length > 0 && (
                  <span className="ml-auto text-[10px] text-[#64748B]">{asset.refineHistory.length} edit{asset.refineHistory.length === 1 ? "" : "s"}</span>
                )}
              </div>

              {/* Quick edit chips */}
              <div className="flex flex-wrap gap-[5px]">
                {QUICK_EDITS.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => setEditText(q.instruction)}
                    disabled={refining}
                    className="px-[8px] py-[4px] rounded-[6px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[10.5px] text-[#94A3B8] hover:text-white transition-all cursor-pointer disabled:opacity-50"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRefine(); } }}
                  placeholder="Describe the change — e.g. 'move the headline to the right and add a green CTA at the bottom'…"
                  rows={2}
                  disabled={refining}
                  className="w-full bg-[#0B1426] border border-white/[0.08] focus:border-[rgba(23,217,75,0.4)] rounded-[8px] px-[10px] py-[8px] pr-[40px] text-[11.5px] text-white placeholder:text-[#475569] outline-none resize-none transition-all disabled:opacity-60"
                />
                <button
                  onClick={handleRefine}
                  disabled={!editText.trim() || refining}
                  className={`absolute right-[6px] bottom-[6px] w-[28px] h-[28px] rounded-[7px] flex items-center justify-center transition-all ${
                    editText.trim() && !refining
                      ? "bg-gradient-to-br from-[#17D94B] to-[#00B2A9] text-white shadow-[0_4px_12px_rgba(23,217,75,0.35)] hover:brightness-110 cursor-pointer"
                      : "bg-white/[0.04] text-[#475569] cursor-not-allowed"
                  }`}
                >
                  {refining ? <Loader2 className="w-[12px] h-[12px] animate-spin" /> : <ArrowUp className="w-[12px] h-[12px]" />}
                </button>
              </div>

              {refineError && (
                <div className="text-[10.5px] text-[#FCA5A5] flex items-start gap-[5px]">
                  <AlertCircle className="w-[10px] h-[10px] mt-[2px] shrink-0" />
                  {refineError}
                </div>
              )}

              {asset.refineHistory && asset.refineHistory.length > 0 && (
                <div className="pt-[6px] border-t border-white/[0.05]">
                  <div className="text-[9.5px] uppercase tracking-[1.2px] text-[#64748B] font-semibold mb-[5px]">Recent edits</div>
                  <div className="flex flex-wrap gap-[4px]">
                    {asset.refineHistory.slice(0, 4).map((h, i) => (
                      <button
                        key={i}
                        onClick={() => setEditText(h)}
                        disabled={refining}
                        className="px-[7px] py-[3px] rounded-[5px] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-[10px] text-[#94A3B8] hover:text-white transition-all cursor-pointer truncate max-w-[180px] disabled:opacity-50"
                        title={h}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Attachment chip

function AttachmentChip({ att, onRemove, dark }: { att: Attachment; onRemove?: () => void; dark?: boolean }) {
  const Icon = att.kind === "image" ? ImageIcon : att.kind === "pdf" ? FileType2 : att.kind === "gdoc" ? Globe : FileText;
  const iconColor = att.kind === "image" ? "text-[#2896FB]" : att.kind === "pdf" ? "text-[#EF4444]" : att.kind === "gdoc" ? "text-[#4285F4]" : "text-[#A855F7]";
  const subtitle = att.loading
    ? "Fetching…"
    : att.error
    ? att.error
    : att.kind === "gdoc"
    ? `${(att.size || 0).toLocaleString()} chars${att.docImages && att.docImages.length > 0 ? ` · ${att.docImages.length} image${att.docImages.length === 1 ? "" : "s"}` : ""}`
    : fmtBytes(att.size);

  if (att.kind === "image" && att.previewUrl) {
    return (
      <div className={`relative group rounded-[10px] overflow-hidden border ${dark ? "border-white/[0.10]" : "border-white/[0.08]"} bg-black/30`}>
        <img src={att.previewUrl} alt={att.name} className="w-[64px] h-[64px] object-cover" />
        {onRemove && (
          <button onClick={onRemove} className="absolute top-[3px] right-[3px] w-[18px] h-[18px] rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <X className="w-[10px] h-[10px]" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-[10px] pl-[10px] pr-[8px] py-[8px] rounded-[10px] max-w-[280px] ${
      att.error ? "bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)]" : "bg-white/[0.04] border border-white/[0.08]"
    }`}>
      <div className={`w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0 bg-white/[0.04] ${att.error ? "text-[#EF4444]" : iconColor}`}>
        {att.loading ? <Loader2 className="w-[13px] h-[13px] animate-spin" /> : att.error ? <AlertCircle className="w-[13px] h-[13px]" /> : <Icon className="w-[13px] h-[13px]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-white truncate">{att.name}</div>
        <div className={`text-[10.5px] truncate ${att.error ? "text-[#FCA5A5]" : "text-[#64748B]"}`}>{subtitle}</div>
      </div>
      {onRemove && (
        <button onClick={onRemove} className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center text-[#64748B] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer shrink-0">
          <X className="w-[12px] h-[12px]" />
        </button>
      )}
    </div>
  );
}

function BriefRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex gap-[10px]">
      <div className="w-[64px] shrink-0 text-[10.5px] uppercase tracking-[1px] text-[#64748B] font-semibold pt-[2px]">{label}</div>
      <div className={`flex-1 text-[#CBD5E1] leading-[1.5] ${bold ? "text-white font-semibold" : ""}`}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Project / hydration helpers

function hydrateMessage(m: StoredMessage): ChatMessage {
  return {
    role: m.role,
    text: m.text,
    attachments: m.attachments,
    generatedAssets: m.generatedAssets?.map((a) => ({ format: a.format, status: a.html ? "done" : a.error ? "error" : "queued", html: a.html, error: a.error })),
  };
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
