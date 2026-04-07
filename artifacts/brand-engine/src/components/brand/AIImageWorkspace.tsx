import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ChevronDown, Image as ImageIcon,
  Download, Eye, Shuffle, Copy, RefreshCw, X,
  Wand2, Settings2
} from "lucide-react";

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

const MOCK_RESULTS = [
  { id: 1, title: "Generation 1", gradient: "from-[#095DC3] via-[#0A3366] to-[#060B16]" },
  { id: 2, title: "Generation 2", gradient: "from-[#00B2A9] via-[#095DC3] to-[#07223D]" },
  { id: 3, title: "Generation 3", gradient: "from-[#2896FB] via-[#095DC3] to-[#060B16]" },
  { id: 4, title: "Generation 4", gradient: "from-[#0A3366] via-[#00B2A9] to-[#095DC3]" },
];

export function AIImageWorkspace() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [style, setStyle] = useState("Auto");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [outputCount, setOutputCount] = useState(4);
  const [creativity, setCreativity] = useState(70);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasResults(true);
    }, 3000);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-y-auto relative">

        <AnimatePresence mode="wait">
          {!hasResults && !isGenerating ? (
            <motion.div
              key="prompt-hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col items-center justify-center px-[32px] pb-[60px]"
            >
              <div className="flex items-center gap-[10px] mb-[8px]">
                <div className="w-[36px] h-[36px] rounded-[12px] bg-gradient-to-br from-[#2896FB] to-[#095DC3] flex items-center justify-center shadow-[0_0_24px_rgba(40,150,251,0.25)]">
                  <Sparkles className="w-[18px] h-[18px] text-white" />
                </div>
                <h1 className="text-[22px] font-bold text-white m-0">AI Image</h1>
              </div>
              <p className="text-[13px] text-[#64748B] mb-[36px]">Generate on-brand visuals with AI</p>

              <div className="w-full max-w-[680px]">
                <div className="relative group">
                  <div className="absolute -inset-[1px] rounded-[24px] bg-gradient-to-r from-[rgba(40,150,251,0.2)] via-[rgba(0,178,169,0.1)] to-[rgba(40,150,251,0.2)] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 blur-[2px]" />
                  <div className="relative rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] backdrop-blur-[24px] group-focus-within:border-[rgba(40,150,251,0.15)] transition-all duration-500">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the image you want to create..."
                      rows={4}
                      className="w-full bg-transparent border-none outline-none resize-none text-[16px] text-[#E2E8F0] placeholder:text-[rgba(255,255,255,0.2)] leading-[1.7] font-normal px-[28px] pt-[24px] pb-[8px]"
                    />
                    <div className="flex items-center justify-between px-[20px] pb-[16px] pt-[4px]">
                      <div className="flex items-center gap-[6px]">
                        <InlineSelect value={aspectRatio} options={ASPECT_RATIOS} onChange={setAspectRatio} />
                        <InlineSelect value={style} options={STYLE_PRESETS} onChange={setStyle} />
                        <button
                          onClick={() => setShowSettings(!showSettings)}
                          className={`flex items-center gap-[5px] py-[6px] px-[10px] rounded-[10px] border text-[11px] font-medium cursor-pointer transition-all duration-200
                            ${showSettings
                              ? 'border-[rgba(40,150,251,0.25)] bg-[rgba(40,150,251,0.08)] text-[#2896FB]'
                              : 'border-[rgba(255,255,255,0.06)] bg-transparent text-[#475569] hover:text-[#94A3B8] hover:border-[rgba(255,255,255,0.1)]'
                            }`}
                        >
                          <Settings2 className="w-[12px] h-[12px]" />
                          More
                        </button>
                      </div>
                      <motion.button
                        onClick={handleGenerate}
                        disabled={!prompt.trim()}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-[8px] py-[9px] px-[20px] rounded-[12px] border-none bg-gradient-to-r from-[#095DC3] to-[#2896FB] text-[13px] font-semibold text-white cursor-pointer shadow-[0_4px_20px_rgba(40,150,251,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_4px_32px_rgba(40,150,251,0.5)]"
                      >
                        <Sparkles className="w-[14px] h-[14px]" />
                        Generate
                      </motion.button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-[12px] rounded-[18px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] backdrop-blur-[20px] p-[20px]">
                        <div className="grid grid-cols-3 gap-[16px]">
                          <div>
                            <div className="text-[10px] font-semibold text-[#475569] mb-[6px] uppercase tracking-[1px]">Outputs</div>
                            <div className="flex gap-[4px]">
                              {[1, 2, 4].map((n) => (
                                <button
                                  key={n}
                                  onClick={() => setOutputCount(n)}
                                  className={`flex-1 py-[6px] rounded-[8px] text-[12px] font-semibold cursor-pointer transition-all duration-200 border
                                    ${outputCount === n
                                      ? 'bg-[rgba(40,150,251,0.1)] border-[rgba(40,150,251,0.2)] text-[#2896FB]'
                                      : 'bg-transparent border-[rgba(255,255,255,0.06)] text-[#475569] hover:text-[#94A3B8]'
                                    }`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold text-[#475569] mb-[6px] uppercase tracking-[1px]">Creativity</div>
                            <input
                              type="range" min={0} max={100} value={creativity}
                              onChange={(e) => setCreativity(Number(e.target.value))}
                              className="w-full h-[3px] rounded-[4px] bg-[rgba(255,255,255,0.06)] outline-none appearance-none cursor-pointer"
                            />
                            <div className="text-[10px] text-[#475569] text-right mt-[2px]">{creativity}%</div>
                          </div>
                          <div className="flex items-center gap-[8px]">
                            <div className="flex-1">
                              <div className="text-[10px] font-semibold text-[#475569] mb-[6px] uppercase tracking-[1px]">Transparent BG</div>
                              <button className="py-[6px] px-[12px] rounded-[8px] border border-[rgba(255,255,255,0.06)] text-[11px] text-[#475569] font-medium cursor-pointer hover:text-[#94A3B8] transition-colors duration-200 bg-transparent">
                                Off
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-[28px]">
                  <div className="text-[10px] font-semibold text-[#364152] uppercase tracking-[1.5px] mb-[10px]">Try something</div>
                  <div className="flex flex-wrap gap-[6px]">
                    {PROMPT_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setPrompt(s)}
                        className="py-[7px] px-[14px] rounded-[12px] border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.015)] text-[12px] text-[#4B5C6F] cursor-pointer transition-all duration-300 hover:bg-[rgba(40,150,251,0.06)] hover:text-[#94A3B8] hover:border-[rgba(40,150,251,0.12)] hover:-translate-y-[1px]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

          ) : isGenerating ? (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center px-[32px]"
            >
              <div className="relative mb-[28px]">
                <div className="w-[64px] h-[64px] rounded-full border-[2px] border-[rgba(40,150,251,0.15)] border-t-[#2896FB] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-[20px] h-[20px] text-[#2896FB]" />
                </div>
              </div>
              <div className="text-[16px] font-semibold text-white mb-[6px]">Generating visuals...</div>
              <div className="text-[12px] text-[#475569]">This usually takes a few seconds</div>

              <div className="grid grid-cols-4 gap-[12px] mt-[40px] w-full max-w-[600px]">
                {Array.from({ length: outputCount }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-[16px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] overflow-hidden">
                    <div className="w-full h-full animate-pulse bg-gradient-to-br from-[rgba(40,150,251,0.04)] to-transparent" />
                  </div>
                ))}
              </div>
            </motion.div>

          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col px-[32px] pt-[20px] pb-[32px]"
            >
              <div className="flex items-center gap-[16px] mb-[20px]">
                <div className="flex-1 relative group">
                  <div className="absolute -inset-[1px] rounded-[16px] bg-gradient-to-r from-[rgba(40,150,251,0.1)] to-[rgba(0,178,169,0.05)] opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-[1px]" />
                  <div className="relative flex items-center gap-[10px] rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] backdrop-blur-[16px] px-[16px] py-[10px] group-focus-within:border-[rgba(40,150,251,0.15)] transition-all duration-300">
                    <Sparkles className="w-[14px] h-[14px] text-[#475569] shrink-0" />
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Refine your prompt..."
                      className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#E2E8F0] placeholder:text-[#475569]"
                    />
                    <div className="flex items-center gap-[4px] shrink-0">
                      <InlineSelect value={aspectRatio} options={ASPECT_RATIOS} onChange={setAspectRatio} />
                      <InlineSelect value={style} options={STYLE_PRESETS} onChange={setStyle} />
                    </div>
                    <motion.button
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-[6px] py-[7px] px-[16px] rounded-[10px] border-none bg-gradient-to-r from-[#095DC3] to-[#2896FB] text-[12px] font-semibold text-white cursor-pointer shadow-[0_2px_12px_rgba(40,150,251,0.25)] disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    >
                      <RefreshCw className="w-[12px] h-[12px]" />
                      Regenerate
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex gap-[12px]">
                <div className="flex-1 grid grid-cols-2 gap-[12px] auto-rows-max">
                  {MOCK_RESULTS.map((result, i) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08, duration: 0.35 }}
                      onClick={() => setSelectedResult(selectedResult === result.id ? null : result.id)}
                      className={`group aspect-square rounded-[18px] relative overflow-hidden cursor-pointer transition-all duration-300
                        ${selectedResult === result.id
                          ? 'ring-[2px] ring-[#2896FB] ring-offset-[3px] ring-offset-[#060B16] shadow-[0_0_30px_rgba(40,150,251,0.15)]'
                          : 'hover:-translate-y-[3px] hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]'
                        }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${result.gradient}`} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-[36px] h-[36px] text-[rgba(255,255,255,0.08)]" />
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.6)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="absolute bottom-0 left-0 right-0 p-[12px] translate-y-[120%] group-hover:translate-y-0 transition-transform duration-300 ease-out">
                        <div className="flex gap-[5px]">
                          {[
                            { icon: Eye, tip: "View" },
                            { icon: Shuffle, tip: "Remix" },
                            { icon: Copy, tip: "Variations" },
                            { icon: Download, tip: "Download" },
                          ].map((action) => (
                            <button
                              key={action.tip}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 h-[32px] rounded-[8px] border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.35)] backdrop-blur-[8px] flex items-center justify-center text-[rgba(255,255,255,0.7)] cursor-pointer transition-all duration-200 hover:bg-[rgba(40,150,251,0.35)] hover:text-white hover:border-[rgba(40,150,251,0.4)]"
                              title={action.tip}
                            >
                              <action.icon className="w-[13px] h-[13px]" />
                            </button>
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
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="shrink-0 overflow-hidden"
                    >
                      <div className="w-[300px] h-full rounded-[18px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] backdrop-blur-[20px] p-[16px] flex flex-col gap-[14px] overflow-y-auto">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-semibold text-white">Details</span>
                          <button
                            onClick={() => setSelectedResult(null)}
                            className="w-[26px] h-[26px] rounded-[8px] border border-[rgba(255,255,255,0.06)] bg-transparent flex items-center justify-center text-[#64748B] cursor-pointer hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all duration-200"
                          >
                            <X className="w-[12px] h-[12px]" />
                          </button>
                        </div>

                        <div className={`aspect-square rounded-[14px] bg-gradient-to-br ${MOCK_RESULTS.find(r => r.id === selectedResult)?.gradient || ''} relative overflow-hidden`}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ImageIcon className="w-[32px] h-[32px] text-[rgba(255,255,255,0.08)]" />
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-semibold text-[#475569] uppercase tracking-[1px] mb-[4px]">Prompt</div>
                          <div className="text-[12px] text-[#94A3B8] leading-[1.6] p-[10px] rounded-[10px] bg-[rgba(0,0,0,0.12)]">
                            {prompt || "—"}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-[6px]">
                          {[["Ratio", aspectRatio], ["Style", style], ["Quality", "High"], ["Seed", "4821"]].map(([k, v]) => (
                            <div key={k} className="py-[5px] px-[8px] rounded-[8px] bg-[rgba(0,0,0,0.08)]">
                              <div className="text-[9px] font-semibold text-[#364152] uppercase">{k}</div>
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
                            <button
                              key={action.label}
                              className={`flex items-center gap-[7px] py-[8px] px-[12px] rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all duration-200 border
                                ${action.primary
                                  ? 'bg-[rgba(40,150,251,0.08)] border-[rgba(40,150,251,0.15)] text-[#2896FB] hover:bg-[rgba(40,150,251,0.14)]'
                                  : 'bg-transparent border-[rgba(255,255,255,0.05)] text-[#94A3B8] hover:bg-[rgba(255,255,255,0.04)] hover:text-white'
                                }`}
                            >
                              <action.icon className="w-[13px] h-[13px]" />
                              {action.label}
                            </button>
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
        className="py-[6px] pl-[10px] pr-[24px] rounded-[10px] bg-transparent border border-[rgba(255,255,255,0.06)] text-[11px] font-medium text-[#64748B] outline-none appearance-none cursor-pointer transition-all duration-200 hover:border-[rgba(255,255,255,0.12)] hover:text-[#94A3B8] focus:border-[rgba(40,150,251,0.2)]"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#0A1628] text-[#CBD5E1]">{o}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-[6px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] text-[#475569] pointer-events-none" />
    </div>
  );
}
