import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, ArrowUp, Loader2, Copy, Check, Wand2, FileText, MessageSquare, Lightbulb, Paperclip, X, Image as ImageIcon, FileType2, Globe, AlertCircle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types

type AttachmentKind = "image" | "pdf" | "text" | "gdoc";

interface Attachment {
  id: string;
  kind: AttachmentKind;
  name: string;
  size?: number; // bytes
  // For image/pdf: base64 (no data: prefix)
  base64?: string;
  mediaType?: string;
  // For image preview
  previewUrl?: string;
  // For text/gdoc: the extracted text
  text?: string;
  // For gdoc: also-extracted embedded images
  docImages?: Array<{ mediaType: string; data: string }>;
  // Loading/error state (used when a Google Doc is being fetched)
  loading?: boolean;
  error?: string;
}

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; mediaType: string; data: string }
  | { type: "document"; mediaType: string; data: string; name?: string };

interface ChatMessage {
  role: "user" | "assistant";
  // For display we keep the rich shape; for the wire we send normalized blocks (or string).
  text: string; // human-typed text
  attachments?: Attachment[]; // rendered as chips, also folded into wire content
  // assistant messages are plain text only
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20MB
const MAX_TEXT_BYTES = 2 * 1024 * 1024; // 2MB
const TEXT_EXT = /\.(txt|md|markdown|json|csv|tsv|html?|xml|yaml|yml|log|js|ts|jsx|tsx|css|sql|py)$/i;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const GDOC_RE = /https?:\/\/(?:docs|drive)\.google\.com\/(?:document\/d|file\/d|open\?id=)\/?([a-zA-Z0-9_-]{20,})/gi;

function uid() { return Math.random().toString(36).slice(2, 10); }

function fmtBytes(b?: number) {
  if (!b && b !== 0) return "";
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
// Design brief parsing (unchanged from before)

interface ParsedBrief {
  format?: string;
  headline?: string;
  subline?: string;
  cta?: string;
  visual?: string;
  human?: string;
  raw: string;
}

function parseDesignBrief(text: string): ParsedBrief | null {
  const m = text.match(/<design_brief>([\s\S]*?)<\/design_brief>/i);
  if (!m) return null;
  const raw = m[1].trim();
  const get = (key: string) => {
    const re = new RegExp(`^\\s*${key}\\s*:\\s*(.+?)\\s*$`, "im");
    const r = raw.match(re);
    return r ? r[1].replace(/^["']|["']$/g, "").trim() : undefined;
  };
  return {
    format: get("Format"),
    headline: get("Headline"),
    subline: get("Subline"),
    cta: get("CTA"),
    visual: get("Visual direction"),
    human: get("Human in shot"),
    raw,
  };
}

function briefToCraftPrompt(brief: ParsedBrief): string {
  const lines: string[] = [];
  if (brief.format) lines.push(brief.format + ".");
  if (brief.headline) lines.push(`Headline: "${brief.headline}".`);
  if (brief.subline && brief.subline.toLowerCase() !== "none") lines.push(`Subline: "${brief.subline}".`);
  if (brief.cta && brief.cta.toLowerCase() !== "none") lines.push(`CTA: "${brief.cta}".`);
  if (brief.visual) lines.push(brief.visual);
  if (brief.human && brief.human.toLowerCase().startsWith("yes")) {
    lines.push(brief.human.replace(/^yes\s*[—-]?\s*/i, "Include a person: "));
  } else {
    lines.push("No human.");
  }
  return lines.join(" ");
}

function stripBriefForDisplay(text: string): string {
  return text.replace(/<design_brief>[\s\S]*?<\/design_brief>/gi, "").trim();
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

// ─────────────────────────────────────────────────────────────────────────────
// Suggestions for empty state

const SUGGESTIONS = [
  { icon: Lightbulb, label: "Brainstorm", prompt: "Brainstorm 5 punchy headline options for a webinar called 'AI Funnels for Agency Owners'. Audience is solo agency operators doing $10–50k/mo." },
  { icon: Wand2, label: "Design a graphic", prompt: "I need a square Instagram graphic announcing our Q2 product launch — it's a new AI workflow builder. Make it feel like a calm, confident reveal, not a hype post." },
  { icon: FileText, label: "Ingest brand", prompt: "Here are my brand notes — read them and summarize my visual style, voice, and what makes us different in 4 bullets." },
  { icon: MessageSquare, label: "Critique copy", prompt: "Critique this headline and rewrite it 3 ways: 'The Future Of Marketing Is Here — Don't Get Left Behind.'" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component

export function BrandBrainWorkspace({ onSendToCraft }: { onSendToCraft: (prompt: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentBriefIds, setSentBriefIds] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // ─────── File ingestion ───────
  const ingestFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const list = Array.from(files);
    for (const file of list) {
      const id = uid();
      try {
        if (IMAGE_TYPES.includes(file.type)) {
          if (file.size > MAX_IMAGE_BYTES) {
            setError(`${file.name} is over 5MB`);
            continue;
          }
          const base64 = await fileToBase64(file);
          setPendingAttachments((p) => [...p, {
            id, kind: "image", name: file.name, size: file.size,
            base64, mediaType: file.type,
            previewUrl: `data:${file.type};base64,${base64}`,
          }]);
        } else if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
          if (file.size > MAX_PDF_BYTES) {
            setError(`${file.name} is over 20MB`);
            continue;
          }
          const base64 = await fileToBase64(file);
          setPendingAttachments((p) => [...p, {
            id, kind: "pdf", name: file.name, size: file.size,
            base64, mediaType: "application/pdf",
          }]);
        } else if (file.type.startsWith("text/") || TEXT_EXT.test(file.name) || file.type === "application/json") {
          if (file.size > MAX_TEXT_BYTES) {
            setError(`${file.name} is over 2MB`);
            continue;
          }
          const text = await fileToText(file);
          setPendingAttachments((p) => [...p, {
            id, kind: "text", name: file.name, size: file.size, text,
          }]);
        } else {
          setError(`${file.name}: unsupported type (${file.type || "unknown"})`);
        }
      } catch (e: any) {
        setError(`Failed to read ${file.name}: ${e?.message || "unknown error"}`);
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
    if (files.length > 0) {
      e.preventDefault();
      ingestFiles(files);
    }
  };

  const removeAttachment = (id: string) => setPendingAttachments((p) => p.filter((a) => a.id !== id));

  // ─────── Google Doc fetching ───────
  interface DocFetchResult {
    text: string;
    images: Array<{ mediaType: string; data: string }>;
    error?: string;
  }
  const fetchGoogleDoc = async (url: string): Promise<DocFetchResult> => {
    try {
      const apiBase = import.meta.env.BASE_URL;
      const res = await fetch(`${apiBase}api/import-doc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return { text: "", images: [], error: j.error || `Doc fetch failed (${res.status})` };
      return { text: j.text || "", images: Array.isArray(j.images) ? j.images : [] };
    } catch (e: any) {
      return { text: "", images: [], error: e?.message || "Network error" };
    }
  };

  // ─────── Send ───────
  const send = useCallback(async (override?: string) => {
    const userText = (override ?? input).trim();
    if (!userText && pendingAttachments.length === 0) return;
    if (loading) return;
    setError(null);

    // Detect Google Doc URLs and fetch them in parallel.
    const docUrls = findGoogleDocUrls(userText);
    let docAttachments: Attachment[] = [];
    if (docUrls.length > 0) {
      // Show fetching chips immediately.
      docAttachments = docUrls.map((u) => ({
        id: uid(), kind: "gdoc" as const, name: "Google Doc", text: "", loading: true,
      }));
      // Optimistically push the user message with the loading chips so the user sees progress.
      const optimisticMsg: ChatMessage = {
        role: "user",
        text: userText,
        attachments: [...pendingAttachments, ...docAttachments],
      };
      setMessages((m) => [...m, optimisticMsg]);
      setInput("");
      setLoading(true);

      const fetched = await Promise.all(docUrls.map(fetchGoogleDoc));
      docAttachments = docAttachments.map((att, i) => ({
        ...att,
        loading: false,
        text: fetched[i].text,
        docImages: fetched[i].images,
        error: fetched[i].error,
        size: fetched[i].text.length,
      }));
      // Patch the last message with resolved doc attachments.
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.role === "user") {
          copy[copy.length - 1] = {
            ...last,
            attachments: [...pendingAttachments, ...docAttachments],
          };
        }
        return copy;
      });
    } else {
      const userMsg: ChatMessage = {
        role: "user",
        text: userText,
        attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined,
      };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setLoading(true);
    }

    setPendingAttachments([]);

    // Build wire payload from full message history.
    try {
      const wireMessages = (() => {
        // Take the messages we just set, but since setState is async, build from a snapshot:
        const all = [...messages];
        // Re-insert the new user message we just optimistically added:
        const newUser: ChatMessage = {
          role: "user",
          text: userText,
          attachments: [...pendingAttachments, ...docAttachments],
        };
        all.push(newUser);
        return all.map((msg) => {
          if (msg.role === "assistant") {
            return { role: "assistant", content: msg.text };
          }
          // user message → blocks
          const blocks: ContentBlock[] = [];
          // Inject text content from text/gdoc attachments first
          for (const att of msg.attachments || []) {
            if (att.kind === "text" && att.text) {
              blocks.push({ type: "text", text: `📎 Attached file: ${att.name}\n\n---\n${att.text}\n---` });
            } else if (att.kind === "gdoc") {
              if (att.error) {
                blocks.push({ type: "text", text: `⚠️ Google Doc fetch failed: ${att.error}` });
              } else if (att.text) {
                const imgNote = att.docImages && att.docImages.length > 0
                  ? ` (${att.docImages.length} embedded image${att.docImages.length === 1 ? "" : "s"} attached below)`
                  : "";
                blocks.push({ type: "text", text: `📄 Google Doc contents${imgNote}:\n\n---\n${att.text}\n---` });
              }
            }
          }
          // Inject images (uploaded + extracted from Google Docs)
          for (const att of msg.attachments || []) {
            if (att.kind === "image" && att.base64 && att.mediaType) {
              blocks.push({ type: "image", mediaType: att.mediaType, data: att.base64 });
            } else if (att.kind === "gdoc" && att.docImages) {
              for (const img of att.docImages) {
                blocks.push({ type: "image", mediaType: img.mediaType, data: img.data });
              }
            }
          }
          // Inject PDFs
          for (const att of msg.attachments || []) {
            if (att.kind === "pdf" && att.base64 && att.mediaType) {
              blocks.push({ type: "document", mediaType: att.mediaType, data: att.base64, name: att.name });
            }
          }
          // Append the typed text last
          if (msg.text) blocks.push({ type: "text", text: msg.text });
          if (blocks.length === 0) blocks.push({ type: "text", text: "(no text)" });
          return { role: "user", content: blocks };
        });
      })();

      const apiBase = import.meta.env.BASE_URL;
      const res = await fetch(`${apiBase}api/brand-brain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: wireMessages }),
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
  }, [input, loading, messages, pendingAttachments]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleCopy = async (id: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1400);
    } catch {}
  };

  const isEmpty = messages.length === 0;
  const canSend = (input.trim().length > 0 || pendingAttachments.length > 0) && !loading;

  // ─────── Drag and drop on the whole pane ───────
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) ingestFiles(e.dataTransfer.files);
  };

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Soft purple aurora */}
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

      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf,text/*,.md,.markdown,.json,.csv,.tsv,.html,.htm,.xml,.yaml,.yml,.log,.js,.ts,.jsx,.tsx,.css,.sql,.py"
        onChange={handleFilePick}
      />

      {/* Scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto sidebar-scroll relative">
        <div className="max-w-[760px] mx-auto px-[24px] md:px-[32px] py-[28px]">
          {isEmpty ? (
            <div className="min-h-[calc(100vh-300px)] flex flex-col items-center justify-center text-center">
              <div className="w-[64px] h-[64px] rounded-[20px] flex items-center justify-center mb-[20px] bg-gradient-to-br from-[#A855F7] via-[#2896FB] to-[#00B2A9] shadow-[0_12px_40px_rgba(168,85,247,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]">
                <Sparkles className="w-[28px] h-[28px] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]" />
              </div>
              <h1 className="text-[34px] md:text-[40px] font-bold tracking-[-1px] bg-gradient-to-r from-white via-[#E2E8F0] to-white bg-clip-text text-transparent">
                Brand Brain
              </h1>
              <p className="text-[15px] text-[#94A3B8] mt-[10px] max-w-[500px]">
                Ask anything. Drop files, paste Google Docs, share images. Craft a design and ship it to Craft Magic with one click.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] mt-[36px] w-full max-w-[600px]">
                {SUGGESTIONS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => send(s.prompt)}
                      className="group text-left p-[16px] rounded-[14px] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 cursor-pointer"
                    >
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
                const brief = m.role === "assistant" ? parseDesignBrief(m.text) : null;
                const display = brief ? stripBriefForDisplay(m.text) : m.text;
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

                          {brief && (
                            <div className="mt-[16px] rounded-[14px] border border-[rgba(168,85,247,0.25)] bg-gradient-to-br from-[rgba(168,85,247,0.08)] via-[rgba(40,150,251,0.06)] to-[rgba(0,178,169,0.05)] overflow-hidden">
                              <div className="px-[16px] py-[12px] border-b border-white/[0.06] flex items-center gap-[10px]">
                                <div className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center bg-gradient-to-br from-[#A855F7] to-[#2896FB] shadow-[0_2px_8px_rgba(168,85,247,0.4)]">
                                  <Wand2 className="w-[11px] h-[11px] text-white" />
                                </div>
                                <div className="text-[12.5px] font-semibold text-white">Design Brief</div>
                                <div className="text-[10px] uppercase tracking-[1.2px] text-[#A855F7] font-semibold ml-auto">Ready</div>
                              </div>
                              <div className="px-[16px] py-[14px] space-y-[8px] text-[12.5px]">
                                {brief.format && <BriefRow label="Format" value={brief.format} />}
                                {brief.headline && <BriefRow label="Headline" value={`"${brief.headline}"`} bold />}
                                {brief.subline && <BriefRow label="Subline" value={`"${brief.subline}"`} />}
                                {brief.cta && <BriefRow label="CTA" value={brief.cta} />}
                                {brief.visual && <BriefRow label="Visual" value={brief.visual} />}
                                {brief.human && <BriefRow label="Human" value={brief.human} />}
                              </div>
                              <div className="px-[16px] pb-[14px] flex items-center gap-[8px]">
                                <button
                                  onClick={() => {
                                    onSendToCraft(briefToCraftPrompt(brief));
                                    setSentBriefIds((s) => new Set(s).add(i));
                                  }}
                                  disabled={sentBriefIds.has(i)}
                                  className={`flex-1 flex items-center justify-center gap-[8px] py-[10px] px-[14px] rounded-[10px] text-[12.5px] font-semibold transition-all duration-200 ${
                                    sentBriefIds.has(i)
                                      ? "bg-[rgba(23,217,75,0.15)] border border-[rgba(23,217,75,0.3)] text-[#17D94B] cursor-default"
                                      : "bg-gradient-to-br from-[#A855F7] via-[#2896FB] to-[#00B2A9] text-white hover:brightness-110 cursor-pointer shadow-[0_6px_20px_rgba(168,85,247,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]"
                                  }`}
                                >
                                  {sentBriefIds.has(i) ? (
                                    <>
                                      <Check className="w-[13px] h-[13px]" />
                                      Sent to Craft Magic
                                    </>
                                  ) : (
                                    <>
                                      <Wand2 className="w-[13px] h-[13px]" />
                                      Send to Craft Magic
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleCopy(i, briefToCraftPrompt(brief))}
                                  className="px-[12px] py-[10px] rounded-[10px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[#94A3B8] hover:text-white transition-all cursor-pointer"
                                  title="Copy brief"
                                >
                                  {copiedId === i ? <Check className="w-[13px] h-[13px]" /> : <Copy className="w-[13px] h-[13px]" />}
                                </button>
                              </div>
                            </div>
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
          {/* Pending attachment chips */}
          {pendingAttachments.length > 0 && (
            <div className="mb-[10px] flex flex-wrap gap-[8px]">
              {pendingAttachments.map((att) => (
                <AttachmentChip key={att.id} att={att} onRemove={() => removeAttachment(att.id)} />
              ))}
            </div>
          )}

          <div className="relative rounded-[20px] bg-[#0B1426]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] focus-within:border-[rgba(168,85,247,0.35)] focus-within:shadow-[0_12px_40px_rgba(168,85,247,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-200">
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              onPaste={handlePaste}
              placeholder="Ask anything, paste a Google Doc link, or drop files…"
              rows={1}
              className="w-full bg-transparent resize-none px-[18px] pt-[16px] pb-[8px] text-[14.5px] text-white placeholder:text-[#475569] outline-none leading-[1.5] max-h-[240px]"
            />
            <div className="flex items-center justify-between px-[10px] pb-[10px] pt-[2px] gap-[8px]">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] text-[#94A3B8] hover:text-white transition-all cursor-pointer"
                title="Attach files"
              >
                <Paperclip className="w-[15px] h-[15px]" />
              </button>
              <div className="flex-1 text-[10.5px] text-[#475569] tracking-[0.3px] truncate">
                <span className="hidden sm:inline">Shift + Enter for newline · Drag, paste, or attach files · </span>Powered by Claude Opus
              </div>
              <button
                onClick={() => send()}
                disabled={!canSend}
                className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center transition-all duration-200 ${
                  canSend
                    ? "bg-gradient-to-br from-[#A855F7] via-[#2896FB] to-[#00B2A9] text-white shadow-[0_6px_18px_rgba(168,85,247,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] hover:brightness-110 cursor-pointer"
                    : "bg-white/[0.04] text-[#475569] cursor-not-allowed"
                }`}
              >
                {loading ? <Loader2 className="w-[15px] h-[15px] animate-spin" /> : <ArrowUp className="w-[15px] h-[15px]" />}
              </button>
            </div>
          </div>
          <div className="text-[10.5px] text-[#475569] text-center mt-[8px]">Brand Brain can make mistakes — sanity-check copy before shipping.</div>
        </div>
      </div>

      <style>{`
        @keyframes bbDot { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); } 40% { opacity: 1; transform: scale(1.1); } }
      `}</style>
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
          <button
            onClick={onRemove}
            className="absolute top-[3px] right-[3px] w-[18px] h-[18px] rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <X className="w-[10px] h-[10px]" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-[10px] pl-[10px] pr-[8px] py-[8px] rounded-[10px] max-w-[280px] ${
      att.error
        ? "bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)]"
        : dark
        ? "bg-white/[0.04] border border-white/[0.08]"
        : "bg-white/[0.04] border border-white/[0.08]"
    }`}>
      <div className={`w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0 bg-white/[0.04] ${att.error ? "text-[#EF4444]" : iconColor}`}>
        {att.loading ? <Loader2 className="w-[13px] h-[13px] animate-spin" /> : att.error ? <AlertCircle className="w-[13px] h-[13px]" /> : <Icon className="w-[13px] h-[13px]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-white truncate">{att.name}</div>
        <div className={`text-[10.5px] truncate ${att.error ? "text-[#FCA5A5]" : "text-[#64748B]"}`}>{subtitle}</div>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center text-[#64748B] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer shrink-0"
        >
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
