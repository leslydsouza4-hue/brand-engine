import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, ArrowUp, Loader2, Copy, Check, Wand2, FileText, MessageSquare, Lightbulb } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

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
  { icon: Wand2, label: "Design a graphic", prompt: "I need a square Instagram graphic announcing our Q2 product launch — it's a new AI workflow builder. Make it feel like a calm, confident reveal, not a hype post." },
  { icon: FileText, label: "Ingest brand", prompt: "Here are my brand notes — read them and summarize my visual style, voice, and what makes us different in 4 bullets:\n\n[paste your Google Doc content here]" },
  { icon: MessageSquare, label: "Critique copy", prompt: "Critique this headline and rewrite it 3 ways: 'The Future Of Marketing Is Here — Don't Get Left Behind.'" },
];

export function BrandBrainWorkspace({ onSendToCraft }: { onSendToCraft: (prompt: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentBriefIds, setSentBriefIds] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
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
    ta.style.height = Math.min(ta.scrollHeight, 220) + "px";
  }, [input]);

  const send = useCallback(async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const apiBase = import.meta.env.BASE_URL;
      const res = await fetch(`${apiBase}api/brand-brain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.text || "(no response)" }]);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Soft purple aurora */}
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.10),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[-300px] right-[-100px] w-[700px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(40,150,251,0.08),transparent_70%)] blur-3xl" />
      </div>

      {/* Scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto sidebar-scroll relative">
        <div className="max-w-[760px] mx-auto px-[24px] md:px-[32px] py-[28px]">
          {isEmpty ? (
            <div className="min-h-[calc(100vh-260px)] flex flex-col items-center justify-center text-center">
              <div className="w-[64px] h-[64px] rounded-[20px] flex items-center justify-center mb-[20px] bg-gradient-to-br from-[#A855F7] via-[#2896FB] to-[#00B2A9] shadow-[0_12px_40px_rgba(168,85,247,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]">
                <Sparkles className="w-[28px] h-[28px] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]" />
              </div>
              <h1 className="text-[34px] md:text-[40px] font-bold tracking-[-1px] bg-gradient-to-r from-white via-[#E2E8F0] to-white bg-clip-text text-transparent">
                Brand Brain
              </h1>
              <p className="text-[15px] text-[#94A3B8] mt-[10px] max-w-[480px]">
                Ask anything. Paste your brand notes. Craft a design and ship it to Craft Magic with one click.
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
                const brief = m.role === "assistant" ? parseDesignBrief(m.content) : null;
                const display = brief ? stripBriefForDisplay(m.content) : m.content;
                return (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "user" ? (
                      <div className="max-w-[85%] px-[16px] py-[12px] rounded-[18px] rounded-br-[6px] bg-gradient-to-br from-[rgba(40,150,251,0.18)] to-[rgba(168,85,247,0.14)] border border-[rgba(40,150,251,0.25)] text-[14px] text-white whitespace-pre-wrap leading-[1.55]">
                        {m.content}
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
                <div className="rounded-[10px] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] px-[14px] py-[10px] text-[12.5px] text-[#FCA5A5]">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 relative z-[1] px-[20px] md:px-[32px] pb-[24px] pt-[12px]">
        <div className="max-w-[760px] mx-auto">
          <div className="relative rounded-[20px] bg-[#0B1426]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] focus-within:border-[rgba(168,85,247,0.35)] focus-within:shadow-[0_12px_40px_rgba(168,85,247,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-200">
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything, paste your brand notes, or describe a design…"
              rows={1}
              className="w-full bg-transparent resize-none px-[18px] pt-[16px] pb-[8px] text-[14.5px] text-white placeholder:text-[#475569] outline-none leading-[1.5] max-h-[220px]"
            />
            <div className="flex items-center justify-between px-[14px] pb-[12px] pt-[2px]">
              <div className="text-[10.5px] text-[#475569] tracking-[0.3px]">
                <span className="hidden sm:inline">Shift + Enter for newline · </span>Powered by Claude Opus
              </div>
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center transition-all duration-200 ${
                  input.trim() && !loading
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

function BriefRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex gap-[10px]">
      <div className="w-[64px] shrink-0 text-[10.5px] uppercase tracking-[1px] text-[#64748B] font-semibold pt-[2px]">{label}</div>
      <div className={`flex-1 text-[#CBD5E1] leading-[1.5] ${bold ? "text-white font-semibold" : ""}`}>{value}</div>
    </div>
  );
}
