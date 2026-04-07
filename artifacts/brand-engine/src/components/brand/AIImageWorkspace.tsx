import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ChevronDown, Image as ImageIcon,
  Download, Eye, Shuffle, Copy, RefreshCw, X,
  Settings2, Shield, Bot, Check
} from "lucide-react";
import { HIGHLY_POSES } from "./highlyData";

const HIGHLY_CHARACTER_SHEET = `"Highly" is the official HighLevel mascot robot. Exact visual description:
- BODY: Small, cute, chibi-proportioned 3D robot. The head is oversized compared to the body (about 60% of total height).
- HEAD: Large smooth rounded white/light-silver capsule shape with a big glossy black visor covering the entire front face area. Dark navy-blue circular ear pieces on each side.
- EYES: Two glowing soft teal/cyan eyes on the black visor. Default expression: two upright oval eyes. Happy expression: two curved arc eyes like happy anime eyes.
- HEAD ANTENNA: Three small upward-pointing arrow icons sitting on top of the head — one yellow, one blue, one green (matching the HighLevel logo arrows). These are always present.
- TORSO: Small compact rounded silver/white torso segment connected to the head by a short silver neck joint. A circular dark-blue emblem/button sits in the center of the chest.
- ARMS & HANDS: Detached floating silver/white hands with dark navy-blue fingers (no visible arm connecting hand to body — they float nearby like Rayman). Hands have 4 fingers plus a thumb, with a white circle on the palm.
- LEGS: No legs. Instead, a single metallic silver cone/jet thruster pointing downward from the bottom of the torso, tapering to a point. A soft blue energy glow emanates from the thruster tip.
- MATERIAL: Smooth, glossy, polished plastic/metal look with subtle blue rim-lighting and soft blue ambient glow.
- OVERALL VIBE: Friendly, approachable, futuristic, Pixar-quality 3D render style. NOT mechanical or industrial — cute and polished like a modern tech mascot.

CRITICAL: Do NOT draw a generic robot. Highly must match EXACTLY the description above — oversized head with black visor, teal eyes, three colored arrows on top, floating detached hands, single jet-cone bottom, no legs.`;

const HIGHLEVEL_LOGO_DESCRIPTION = `The HighLevel logo consists of exactly three upward-pointing arrow shapes side by side (yellow on the left, blue in the center, green on the right) followed by the word "HighLevel" in clean white bold sans-serif text. The arrows are simple filled chevron/arrow shapes pointing up, evenly spaced. Do NOT invent a different logo — use ONLY this exact design: three colored arrows (yellow, blue, green) + "HighLevel" wordmark.`;

const BRAND_SYSTEM_PROMPT = `Create a premium marketing image in HighLevel brand style.

Use a modern SaaS design aesthetic with clean composition, strong visual hierarchy, and minimal clutter.

Apply HighLevel visual identity:
- deep blue to electric blue gradients
- subtle teal and green accents
- soft glow lighting and radial highlights
- smooth gradients and polished surfaces
- futuristic, high-end, and professional look

HighLevel logo rules:
${HIGHLEVEL_LOGO_DESCRIPTION}
If the image includes any logo, branding, or text that says "HighLevel", it MUST use the exact logo described above. Never generate a random or made-up logo.

Keep the design clean, spacious, and campaign-ready.
Avoid random colors, avoid clutter, avoid generic AI styles.

User request:
{{USER_PROMPT}}

Make the final result look like a real HighLevel campaign asset, suitable for ads, social media, or product marketing.`;

const ROBOT_KEYWORDS = /\b(highly|robot|mascot|bot|character)\b/i;

const buildFullPrompt = (userPrompt: string, highlyDescription?: string) => {
  let enrichedPrompt = userPrompt;

  const mentionsHighly = ROBOT_KEYWORDS.test(userPrompt);
  if (highlyDescription) {
    enrichedPrompt += `\n\n${HIGHLY_CHARACTER_SHEET}\n\nPose: ${highlyDescription}. Place this exact Highly mascot prominently in the composition. Do NOT use any other robot design.`;
  } else if (mentionsHighly) {
    enrichedPrompt += `\n\n${HIGHLY_CHARACTER_SHEET}\n\nThe user mentioned a robot/mascot — they mean Highly, the HighLevel mascot described above. Render Highly exactly as described. Do NOT use any generic robot design.`;
  }

  return BRAND_SYSTEM_PROMPT.replace("{{USER_PROMPT}}", enrichedPrompt);
};

const PROMPT_SUGGESTIONS = [
  "A futuristic city skyline at sunset with HighLevel branding",
  "3D robot mascot holding a glowing orb in space",
  "Summer campaign hero with tropical gradient",
  "Minimal product mockup on dark marble surface",
  "Abstract brand pattern with electric blue waves",
  "Social media ad with bold typography and gradients",
];

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:2"];
const STYLE_PRESETS = ["Auto", "Photorealistic", "3D Render", "Illustration", "Cinematic", "Abstract"];

const API_BASE = "/api";

type GeneratedImage = { id: number; image: string };

const ASPECT_TO_SIZE: Record<string, string> = {
  "1:1": "1024x1024",
  "16:9": "1536x1024",
  "9:16": "1024x1536",
  "4:3": "1024x1024",
  "3:2": "1024x1024",
};

function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; r: number; vx: number; vy: number; a: number; phase: number }[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * 1200,
        y: Math.random() * 800,
        r: Math.random() * 1.6 + 0.3,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.08,
        a: Math.random() * 0.3 + 0.04,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w(), h());
      const t = Date.now() * 0.0008;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w() + 10;
        if (p.x > w() + 10) p.x = -10;
        if (p.y < -10) p.y = h() + 10;
        if (p.y > h() + 10) p.y = -10;

        const alpha = p.a * (0.5 + 0.5 * Math.sin(p.phase + t));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120, 190, 255, ${alpha})`;
        ctx.fill();

        if (p.r > 0.8) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(40, 150, 251, ${alpha * 0.08})`;
          ctx.fill();
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />;
}

export function AIImageWorkspace() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [style, setStyle] = useState("Auto");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [selectedResult, setSelectedResult] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [outputCount, setOutputCount] = useState(4);
  const [creativity, setCreativity] = useState(70);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHighly, setSelectedHighly] = useState<string | null>(null);
  const [showHighlyPicker, setShowHighlyPicker] = useState(false);

  const activeHighly = HIGHLY_POSES.find(h => h.id === selectedHighly);
  const hasResults = results.length > 0;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setSelectedResult(null);

    const fullPrompt = buildFullPrompt(prompt, activeHighly?.description);
    const size = ASPECT_TO_SIZE[aspectRatio] || "1024x1024";

    try {
      const res = await fetch(`${API_BASE}/openai/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt, size, count: outputCount }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      const images: GeneratedImage[] = (data.images as string[]).map(
        (b64: string, i: number) => ({
          id: i + 1,
          image: `data:image/png;base64,${b64}`,
        })
      );
      setResults(images);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-y-auto relative">

        <div className="absolute inset-0 ai-bg-layer z-0" />

        <div className="absolute top-[15%] left-[10%] w-[350px] h-[350px] rounded-full bg-[radial-gradient(circle,rgba(9,93,195,0.18)_0%,transparent_70%)] ai-orb-1 pointer-events-none z-0" />
        <div className="absolute bottom-[10%] right-[8%] w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle,rgba(40,150,251,0.12)_0%,transparent_70%)] ai-orb-2 pointer-events-none z-0" />
        <div className="absolute top-[50%] left-[55%] w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(0,178,169,0.1)_0%,transparent_70%)] ai-orb-3 pointer-events-none z-0" />

        <FloatingParticles />

        <AnimatePresence mode="wait">
          {!hasResults && !isGenerating ? (
            <motion.div
              key="prompt-hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex-1 flex flex-col items-center justify-center px-[32px] pb-[60px] relative z-[2]"
            >
              <div className="ai-header-float flex items-center gap-[10px] mb-[8px]">
                <div className="relative">
                  <div className="absolute inset-[-8px] rounded-[20px] bg-[radial-gradient(circle,rgba(40,150,251,0.35)_0%,transparent_70%)] blur-[6px]" />
                  <div className="relative w-[40px] h-[40px] rounded-[14px] bg-gradient-to-br from-[#3DA4FF] via-[#2896FB] to-[#095DC3] flex items-center justify-center shadow-[0_0_28px_rgba(40,150,251,0.4)]">
                    <div className="absolute inset-0 rounded-[14px] bg-gradient-to-br from-[rgba(255,255,255,0.2)] to-transparent" />
                    <Sparkles className="w-[20px] h-[20px] text-white relative z-[1]" />
                  </div>
                </div>
                <h1 className="text-[24px] font-bold text-white m-0">AI Image</h1>
              </div>

              <motion.p
                className="text-[13px] text-[#7B8BA5] mb-[40px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                Generate on-brand visuals with AI
              </motion.p>

              <div className="w-full max-w-[680px]">
                <div className="relative group">
                  <div className={`absolute -inset-[50px] rounded-[90px] pointer-events-none transition-opacity duration-1000 ai-prompt-glow-pulse ${isFocused ? 'opacity-100' : 'opacity-60'}`}
                    style={{ background: 'radial-gradient(ellipse at center, rgba(40,150,251,0.08) 0%, rgba(9,93,195,0.04) 40%, transparent 70%)' }}
                  />

                  <motion.div
                    animate={isFocused ? { y: -2 } : { y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="relative"
                  >
                    <div className={`absolute -inset-[1px] rounded-[24px] transition-opacity duration-700 blur-[3px] ${isFocused ? 'opacity-100' : 'opacity-0'}`}
                      style={{ background: 'linear-gradient(135deg, rgba(40,150,251,0.35), rgba(0,178,169,0.15), rgba(40,150,251,0.35))' }}
                    />

                    <div className={`relative rounded-[24px] border bg-[rgba(255,255,255,0.03)] backdrop-blur-[24px] transition-all duration-500 overflow-hidden ai-shimmer-surface
                      ${isFocused ? 'border-[rgba(40,150,251,0.22)] shadow-[0_8px_50px_rgba(0,0,0,0.2),0_0_40px_rgba(40,150,251,0.06)]' : 'border-[rgba(255,255,255,0.08)] shadow-[0_4px_40px_rgba(0,0,0,0.15)]'}`}
                    >
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Describe the image you want to create..."
                        rows={4}
                        className="w-full bg-transparent border-none outline-none resize-none text-[16px] text-[#F1F5F9] placeholder:text-[rgba(255,255,255,0.2)] leading-[1.7] font-normal px-[28px] pt-[24px] pb-[8px] relative z-[1]"
                      />
                      <div className="flex items-center gap-[6px] px-[20px] pt-[2px] relative z-[1]">
                        <div className="flex items-center gap-[5px] py-[3px] px-[8px] rounded-[8px] bg-[rgba(0,178,169,0.06)] border border-[rgba(0,178,169,0.12)]">
                          <Shield className="w-[10px] h-[10px] text-[#00B2A9]" />
                          <span className="text-[9px] font-semibold text-[#00B2A9] uppercase tracking-[0.5px]">HighLevel Brand Context Applied</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-[20px] pb-[16px] pt-[6px] relative z-[1]">
                        <div className="flex items-center gap-[6px]">
                          <InlineSelect value={aspectRatio} options={ASPECT_RATIOS} onChange={setAspectRatio} />
                          <InlineSelect value={style} options={STYLE_PRESETS} onChange={setStyle} />
                          <motion.button
                            onClick={() => setShowHighlyPicker(!showHighlyPicker)}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className={`flex items-center gap-[5px] py-[6px] px-[10px] rounded-[10px] border text-[11px] font-medium cursor-pointer transition-all duration-200
                              ${selectedHighly
                                ? 'border-[rgba(0,178,169,0.3)] bg-[rgba(0,178,169,0.1)] text-[#00B2A9]'
                                : 'border-[rgba(255,255,255,0.08)] bg-transparent text-[#5A6B80] hover:text-[#A0B0C4] hover:border-[rgba(255,255,255,0.14)] hover:bg-[rgba(255,255,255,0.02)]'
                              }`}
                          >
                            {activeHighly ? (
                              <img src={activeHighly.image} alt="" className="w-[14px] h-[14px] object-contain" />
                            ) : (
                              <Bot className="w-[12px] h-[12px]" />
                            )}
                            {activeHighly ? activeHighly.name : "Highly"}
                          </motion.button>
                          <motion.button
                            onClick={() => setShowSettings(!showSettings)}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className={`flex items-center gap-[5px] py-[6px] px-[10px] rounded-[10px] border text-[11px] font-medium cursor-pointer transition-all duration-200
                              ${showSettings
                                ? 'border-[rgba(40,150,251,0.3)] bg-[rgba(40,150,251,0.1)] text-[#3DA4FF]'
                                : 'border-[rgba(255,255,255,0.08)] bg-transparent text-[#5A6B80] hover:text-[#A0B0C4] hover:border-[rgba(255,255,255,0.14)] hover:bg-[rgba(255,255,255,0.02)]'
                              }`}
                          >
                            <Settings2 className="w-[12px] h-[12px]" />
                            More
                          </motion.button>
                        </div>
                        <motion.button
                          onClick={handleGenerate}
                          disabled={!prompt.trim()}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.96 }}
                          className={`flex items-center gap-[8px] py-[10px] px-[22px] rounded-[12px] border-none text-[13px] font-semibold text-white cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-300 ${prompt.trim() ? 'ai-btn-alive' : ''}`}
                          style={{
                            background: 'linear-gradient(135deg, #095DC3 0%, #2896FB 50%, #3DA4FF 100%)',
                            boxShadow: prompt.trim()
                              ? '0 4px 24px rgba(40,150,251,0.35), 0 0 40px rgba(40,150,251,0.1), inset 0 1px 0 rgba(255,255,255,0.18)'
                              : 'none',
                          }}
                        >
                          <Sparkles className="w-[14px] h-[14px]" />
                          Generate
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-[12px] rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] backdrop-blur-[20px] p-[20px]">
                        <div className="grid grid-cols-3 gap-[16px]">
                          <div>
                            <div className="text-[10px] font-semibold text-[#5A6B80] mb-[6px] uppercase tracking-[1px]">Outputs</div>
                            <div className="flex gap-[4px]">
                              {[1, 2, 4].map((n) => (
                                <motion.button
                                  key={n}
                                  onClick={() => setOutputCount(n)}
                                  whileHover={{ scale: 1.06 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`flex-1 py-[6px] rounded-[8px] text-[12px] font-semibold cursor-pointer transition-all duration-200 border
                                    ${outputCount === n
                                      ? 'bg-[rgba(40,150,251,0.12)] border-[rgba(40,150,251,0.25)] text-[#3DA4FF] shadow-[0_0_12px_rgba(40,150,251,0.1)]'
                                      : 'bg-transparent border-[rgba(255,255,255,0.06)] text-[#5A6B80] hover:text-[#A0B0C4] hover:border-[rgba(255,255,255,0.1)]'
                                    }`}
                                >
                                  {n}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold text-[#5A6B80] mb-[6px] uppercase tracking-[1px]">Creativity</div>
                            <input
                              type="range" min={0} max={100} value={creativity}
                              onChange={(e) => setCreativity(Number(e.target.value))}
                              className="w-full h-[3px] rounded-[4px] bg-[rgba(255,255,255,0.08)] outline-none appearance-none cursor-pointer accent-[#2896FB]"
                            />
                            <div className="text-[10px] text-[#5A6B80] text-right mt-[2px]">{creativity}%</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold text-[#5A6B80] mb-[6px] uppercase tracking-[1px]">Transparent BG</div>
                            <motion.button
                              whileHover={{ scale: 1.04 }}
                              className="py-[6px] px-[12px] rounded-[8px] border border-[rgba(255,255,255,0.08)] text-[11px] text-[#5A6B80] font-medium cursor-pointer hover:text-[#A0B0C4] hover:border-[rgba(255,255,255,0.14)] transition-all duration-200 bg-transparent"
                            >
                              Off
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showHighlyPicker && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-[12px] rounded-[18px] border border-[rgba(0,178,169,0.1)] bg-[rgba(255,255,255,0.025)] backdrop-blur-[20px] p-[16px]">
                        <div className="flex items-center justify-between mb-[12px]">
                          <div className="flex items-center gap-[6px]">
                            <Bot className="w-[12px] h-[12px] text-[#00B2A9]" />
                            <span className="text-[10px] font-semibold text-[#00B2A9] uppercase tracking-[1px]">Choose a Highly Pose</span>
                          </div>
                          {selectedHighly && (
                            <motion.button
                              onClick={() => setSelectedHighly(null)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="text-[10px] text-[#5A6B80] hover:text-[#FF6B6B] cursor-pointer transition-colors"
                            >
                              Remove
                            </motion.button>
                          )}
                        </div>
                        <div className="grid grid-cols-7 gap-[8px]">
                          {HIGHLY_POSES.map((pose) => (
                            <motion.button
                              key={pose.id}
                              onClick={() => setSelectedHighly(selectedHighly === pose.id ? null : pose.id)}
                              whileHover={{ scale: 1.08, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              className={`relative aspect-square rounded-[12px] border overflow-hidden cursor-pointer transition-all duration-200 group
                                ${selectedHighly === pose.id
                                  ? 'border-[#00B2A9] bg-[rgba(0,178,169,0.1)] ring-[2px] ring-[#00B2A9] ring-offset-[2px] ring-offset-[#060B16]'
                                  : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(0,178,169,0.2)] hover:bg-[rgba(0,178,169,0.04)]'
                                }`}
                              title={pose.name}
                            >
                              <img src={pose.image} alt={pose.name} className="w-full h-full object-contain p-[4px]" />
                              {selectedHighly === pose.id && (
                                <div className="absolute top-[2px] right-[2px] w-[14px] h-[14px] rounded-full bg-[#00B2A9] flex items-center justify-center">
                                  <Check className="w-[8px] h-[8px] text-white" />
                                </div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 bg-[rgba(0,0,0,0.7)] py-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="text-[7px] text-white text-center truncate px-[2px]">{pose.name}</div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-[16px] px-[16px] py-[10px] rounded-[12px] border border-[rgba(255,80,80,0.2)] bg-[rgba(255,80,80,0.06)] text-[12px] text-[#FF6B6B] text-center"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.div
                  className="mt-[28px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="text-[10px] font-semibold text-[#3D4E63] uppercase tracking-[1.5px] mb-[10px]">Try something</div>
                  <div className="flex flex-wrap gap-[6px]">
                    {PROMPT_SUGGESTIONS.map((s, i) => (
                      <motion.button
                        key={s}
                        onClick={() => setPrompt(s)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.4, ease: "easeOut" }}
                        whileHover={{
                          y: -3,
                          boxShadow: "0 6px 20px rgba(40,150,251,0.1), 0 0 12px rgba(40,150,251,0.05)",
                          backgroundColor: "rgba(40,150,251,0.07)",
                          borderColor: "rgba(40,150,251,0.18)",
                          color: "#A0B0C4",
                          transition: { duration: 0.25 }
                        }}
                        className="py-[7px] px-[14px] rounded-[12px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] text-[12px] text-[#5A6B80] cursor-pointer transition-all duration-300"
                      >
                        {s}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>

          ) : isGenerating ? (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center px-[32px] relative z-[2]"
            >
              <div className="relative mb-[28px]">
                <div className="absolute inset-[-24px] rounded-full bg-[radial-gradient(circle,rgba(40,150,251,0.15)_0%,transparent_70%)] ai-prompt-glow-pulse" />
                <div className="w-[64px] h-[64px] rounded-full border-[2px] border-[rgba(40,150,251,0.2)] border-t-[#3DA4FF] animate-spin shadow-[0_0_24px_rgba(40,150,251,0.15)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-[20px] h-[20px] text-[#3DA4FF]" />
                </div>
              </div>
              <div className="text-[16px] font-semibold text-[#F1F5F9] mb-[6px]">Generating with AI...</div>
              <div className="text-[12px] text-[#5A6B80]">Creating {outputCount} on-brand images — this may take 15-30 seconds</div>

              <div className="grid grid-cols-4 gap-[12px] mt-[40px] w-full max-w-[600px]">
                {Array.from({ length: outputCount }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="aspect-square rounded-[16px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] overflow-hidden"
                  >
                    <motion.div
                      animate={{ opacity: [0.25, 0.55, 0.25] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
                      className="w-full h-full bg-gradient-to-br from-[rgba(40,150,251,0.07)] via-[rgba(0,178,169,0.04)] to-transparent"
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>

          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col px-[32px] pt-[20px] pb-[32px] relative z-[2]"
            >
              <div className="flex items-center gap-[16px] mb-[20px]">
                <div className="flex-1 relative group">
                  <div className="absolute -inset-[1px] rounded-[16px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-[2px]"
                    style={{ background: 'linear-gradient(90deg, rgba(40,150,251,0.25), rgba(0,178,169,0.12), rgba(40,150,251,0.25))' }}
                  />
                  <div className="relative flex items-center gap-[10px] rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] backdrop-blur-[16px] px-[16px] py-[10px] group-focus-within:border-[rgba(40,150,251,0.22)] transition-all duration-300 shadow-[0_2px_20px_rgba(0,0,0,0.1)] overflow-hidden ai-shimmer-surface">
                    <Sparkles className="w-[14px] h-[14px] text-[#5A6B80] shrink-0" />
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Refine your prompt..."
                      className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#F1F5F9] placeholder:text-[#5A6B80] relative z-[1]"
                    />
                    <div className="flex items-center gap-[4px] shrink-0 relative z-[1]">
                      <InlineSelect value={aspectRatio} options={ASPECT_RATIOS} onChange={setAspectRatio} />
                      <InlineSelect value={style} options={STYLE_PRESETS} onChange={setStyle} />
                    </div>
                    <motion.button
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      className="flex items-center gap-[6px] py-[7px] px-[16px] rounded-[10px] border-none text-[12px] font-semibold text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0 transition-all duration-300 relative z-[1]"
                      style={{
                        background: 'linear-gradient(135deg, #095DC3 0%, #2896FB 60%, #3DA4FF 100%)',
                        boxShadow: '0 2px 16px rgba(40,150,251,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                      }}
                    >
                      <RefreshCw className="w-[12px] h-[12px]" />
                      Regenerate
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex gap-[12px]">
                <div className="flex-1 grid grid-cols-2 gap-[12px] auto-rows-max">
                  {results.map((result, i) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, scale: 0.9, y: 16 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.45, ease: "easeOut" }}
                      onClick={() => setSelectedResult(selectedResult === result.id ? null : result.id)}
                      whileHover={{
                        y: -5,
                        boxShadow: "0 20px 50px rgba(0,0,0,0.45), 0 0 28px rgba(40,150,251,0.08)",
                        transition: { duration: 0.3 }
                      }}
                      className={`group aspect-square rounded-[18px] relative overflow-hidden cursor-pointer transition-shadow duration-300
                        ${selectedResult === result.id
                          ? 'ring-[2px] ring-[#3DA4FF] ring-offset-[3px] ring-offset-[#060B16] shadow-[0_0_36px_rgba(40,150,251,0.2)]'
                          : ''
                        }`}
                    >
                      <img src={result.image} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgba(255,255,255,0.08)_0%,transparent_55%)] z-[1]" />
                      <div className="absolute inset-0 flex items-center justify-center z-[1]">
                        <ImageIcon className="w-[36px] h-[36px] text-[rgba(255,255,255,0.06)]" />
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.65)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="absolute bottom-0 left-0 right-0 p-[12px] translate-y-[120%] group-hover:translate-y-0 transition-transform duration-300 ease-out">
                        <div className="flex gap-[5px]">
                          {[
                            { icon: Eye, tip: "View" },
                            { icon: Shuffle, tip: "Remix" },
                            { icon: Copy, tip: "Variations" },
                            { icon: Download, tip: "Download" },
                          ].map((action) => (
                            <motion.button
                              key={action.tip}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (action.tip === "Download") {
                                  const a = document.createElement("a");
                                  a.href = result.image;
                                  a.download = `highlevel-brand-${result.id}.png`;
                                  a.click();
                                }
                              }}
                              whileHover={{ scale: 1.1, backgroundColor: "rgba(40,150,251,0.45)" }}
                              whileTap={{ scale: 0.92 }}
                              className="flex-1 h-[32px] rounded-[8px] border border-[rgba(255,255,255,0.14)] bg-[rgba(0,0,0,0.4)] backdrop-blur-[10px] flex items-center justify-center text-[rgba(255,255,255,0.75)] cursor-pointer transition-all duration-200 hover:text-white hover:border-[rgba(40,150,251,0.5)] hover:shadow-[0_0_14px_rgba(40,150,251,0.2)]"
                              title={action.tip}
                            >
                              <action.icon className="w-[13px] h-[13px]" />
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <AnimatePresence>
                  {selectedResult !== null && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 300, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="shrink-0 overflow-hidden"
                    >
                      <div className="w-[300px] h-full rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] backdrop-blur-[20px] p-[16px] flex flex-col gap-[14px] overflow-y-auto shadow-[0_4px_30px_rgba(0,0,0,0.15)]">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-semibold text-[#F1F5F9]">Details</span>
                          <motion.button
                            onClick={() => setSelectedResult(null)}
                            whileHover={{ scale: 1.12, backgroundColor: "rgba(255,255,255,0.06)" }}
                            whileTap={{ scale: 0.9 }}
                            className="w-[26px] h-[26px] rounded-[8px] border border-[rgba(255,255,255,0.08)] bg-transparent flex items-center justify-center text-[#7B8BA5] cursor-pointer transition-all duration-200"
                          >
                            <X className="w-[12px] h-[12px]" />
                          </motion.button>
                        </div>

                        <div className="aspect-square rounded-[14px] relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
                          <img src={results.find(r => r.id === selectedResult)?.image || ''} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgba(255,255,255,0.08)_0%,transparent_55%)]" />
                        </div>

                        <div>
                          <div className="text-[10px] font-semibold text-[#5A6B80] uppercase tracking-[1px] mb-[4px]">Your Prompt</div>
                          <div className="text-[12px] text-[#A0B0C4] leading-[1.6] p-[10px] rounded-[10px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.03)]">
                            {prompt || "\u2014"}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-[5px] mb-[4px]">
                            <Shield className="w-[9px] h-[9px] text-[#00B2A9]" />
                            <div className="text-[10px] font-semibold text-[#00B2A9] uppercase tracking-[1px]">Full Brand Prompt</div>
                          </div>
                          <div className="text-[10px] text-[#7B8BA5] leading-[1.6] p-[10px] rounded-[10px] bg-[rgba(0,0,0,0.15)] border border-[rgba(0,178,169,0.06)] max-h-[120px] overflow-y-auto whitespace-pre-wrap">
                            {prompt ? buildFullPrompt(prompt, activeHighly?.description) : "\u2014"}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-[6px]">
                          {[["Ratio", aspectRatio], ["Style", style], ["Quality", "High"], ["Seed", "4821"]].map(([k, v]) => (
                            <div key={k} className="py-[5px] px-[8px] rounded-[8px] bg-[rgba(0,0,0,0.1)] border border-[rgba(255,255,255,0.03)]">
                              <div className="text-[9px] font-semibold text-[#3D4E63] uppercase">{k}</div>
                              <div className="text-[11px] font-medium text-[#CBD5E1]">{v}</div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col gap-[5px]">
                          {[
                            { icon: RefreshCw, label: "Regenerate", primary: true },
                            { icon: Copy, label: "Variations", primary: false },
                            { icon: Download, label: "Download", primary: false },
                          ].map((action) => (
                            <motion.button
                              key={action.label}
                              whileHover={{ scale: 1.02, y: -1 }}
                              whileTap={{ scale: 0.98 }}
                              className={`flex items-center gap-[7px] py-[8px] px-[12px] rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all duration-200 border
                                ${action.primary
                                  ? 'bg-[rgba(40,150,251,0.1)] border-[rgba(40,150,251,0.2)] text-[#3DA4FF] hover:bg-[rgba(40,150,251,0.16)] shadow-[0_0_16px_rgba(40,150,251,0.06)]'
                                  : 'bg-transparent border-[rgba(255,255,255,0.06)] text-[#A0B0C4] hover:bg-[rgba(255,255,255,0.04)] hover:text-white hover:border-[rgba(255,255,255,0.1)]'
                                }`}
                            >
                              <action.icon className="w-[13px] h-[13px]" />
                              {action.label}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function InlineSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="py-[6px] pl-[10px] pr-[24px] rounded-[10px] bg-transparent border border-[rgba(255,255,255,0.08)] text-[11px] font-medium text-[#7B8BA5] outline-none appearance-none cursor-pointer transition-all duration-200 hover:border-[rgba(255,255,255,0.16)] hover:text-[#A0B0C4] focus:border-[rgba(40,150,251,0.25)]"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#0A1628] text-[#CBD5E1]">{o}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-[6px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] text-[#5A6B80] pointer-events-none" />
    </div>
  );
}
