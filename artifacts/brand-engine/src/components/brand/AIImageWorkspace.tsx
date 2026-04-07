import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Plus, Clock, Settings, ChevronDown, ChevronRight,
  Image as ImageIcon, Zap, Download, Eye, Shuffle, Copy,
  RefreshCw, X, Sliders, ToggleLeft, ToggleRight,
  Palette, Layers, Target, Wand2, Star, Grid3X3,
  Maximize2, SlidersHorizontal
} from "lucide-react";

const PROMPT_SUGGESTIONS = [
  "Summer campaign hero",
  "Event background",
  "Product promo visual",
  "Highly mascot concept",
  "Social ad creative",
  "Branded wallpaper",
];

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2"];
const STYLE_PRESETS = ["Photorealistic", "3D Render", "Illustration", "Cinematic", "Flat Design", "Abstract"];
const QUALITY_OPTIONS = ["Standard", "High", "Ultra"];

const OUTPUT_PRESETS = [
  { id: "campaign", name: "Campaign Hero", icon: Star },
  { id: "social", name: "Social Post", icon: Grid3X3 },
  { id: "ad", name: "Ad Creative", icon: Zap },
  { id: "background", name: "Background", icon: Layers },
  { id: "character", name: "Character Scene", icon: Wand2 },
  { id: "product", name: "Product Promo", icon: Target },
  { id: "event", name: "Event Visual", icon: Palette },
];

const REFERENCE_CARDS = [
  { id: "bg", name: "Blue Gradient", tag: "Background", color: "from-[#095DC3] to-[#0A3366]" },
  { id: "robot", name: "Highly Robot", tag: "Character", color: "from-[#00B2A9] to-[#095DC3]" },
  { id: "logo", name: "HighLevel Logo", tag: "Brand", color: "from-[#2896FB] to-[#095DC3]" },
  { id: "pattern", name: "Brand Pattern", tag: "Style", color: "from-[#0A3366] to-[#060B16]" },
  { id: "campaign", name: "Campaign Visual", tag: "Reference", color: "from-[#00B2A9] to-[#060B16]" },
];

const MOCK_RESULTS = [
  { id: 1, title: "Campaign Hero v1", status: "Complete" },
  { id: 2, title: "Campaign Hero v2", status: "Complete" },
  { id: 3, title: "Variation A", status: "Complete" },
  { id: 4, title: "Variation B", status: "Complete" },
  { id: 5, title: "Social Crop", status: "Complete" },
  { id: 6, title: "Wide Format", status: "Complete" },
];

export function AIImageWorkspace() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [stylePreset, setStylePreset] = useState("Photorealistic");
  const [outputCount, setOutputCount] = useState(4);
  const [quality, setQuality] = useState("High");
  const [creativity, setCreativity] = useState(70);
  const [brandAdherence, setBrandAdherence] = useState(80);
  const [referenceStrength, setReferenceStrength] = useState(50);
  const [transparentBg, setTransparentBg] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activePreset, setActivePreset] = useState("campaign");
  const [selectedResult, setSelectedResult] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [activeRefs, setActiveRefs] = useState<string[]>(["logo", "bg"]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasResults(true);
    }, 3000);
  };

  const toggleRef = (id: string) => {
    setActiveRefs(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="px-[32px] pt-[16px] pb-[24px] flex flex-col gap-[24px] max-w-[1100px] mx-auto w-full">

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-[10px]">
                <div className="w-[32px] h-[32px] rounded-[10px] bg-gradient-to-br from-[#2896FB] to-[#095DC3] flex items-center justify-center shadow-[0_0_20px_rgba(40,150,251,0.3)]">
                  <Sparkles className="w-[16px] h-[16px] text-white" />
                </div>
                <h1 className="text-[18px] font-bold text-white m-0">AI Image</h1>
              </div>
              <p className="text-[12px] text-[#64748B] mt-[4px] ml-[42px]">Generate on-brand visuals with AI</p>
            </div>
            <div className="flex items-center gap-[6px]">
              {[
                { icon: Plus, label: "New Session" },
                { icon: Clock, label: "History" },
                { icon: Settings, label: "Settings" },
              ].map((item) => (
                <button
                  key={item.label}
                  className="flex items-center gap-[6px] py-[7px] px-[12px] rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] text-[12px] font-medium text-[#94A3B8] cursor-pointer transition-all duration-200 hover:bg-[rgba(255,255,255,0.06)] hover:text-white hover:border-[rgba(255,255,255,0.1)]"
                >
                  <item.icon className="w-[14px] h-[14px]" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-[1px] rounded-[20px] bg-gradient-to-r from-[rgba(40,150,251,0.15)] via-[rgba(0,178,169,0.1)] to-[rgba(40,150,251,0.15)] opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-[1px]" />
            <div className="relative rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] backdrop-blur-[20px] p-[20px] group-focus-within:border-[rgba(40,150,251,0.2)] transition-all duration-300">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                rows={3}
                className="w-full bg-transparent border-none outline-none resize-none text-[15px] text-[#E2E8F0] placeholder:text-[#475569] leading-[1.6] font-normal"
              />
              <div className="flex items-center justify-between mt-[12px] pt-[12px] border-t border-[rgba(255,255,255,0.04)]">
                <div className="flex flex-wrap gap-[6px]">
                  {PROMPT_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setPrompt(s)}
                      className="py-[5px] px-[12px] rounded-[8px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[11px] font-medium text-[#64748B] cursor-pointer transition-all duration-200 hover:bg-[rgba(40,150,251,0.08)] hover:text-[#94A3B8] hover:border-[rgba(40,150,251,0.15)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <motion.button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-[8px] py-[10px] px-[22px] rounded-[12px] border-none bg-gradient-to-r from-[#095DC3] to-[#2896FB] text-[13px] font-semibold text-white cursor-pointer shadow-[0_4px_20px_rgba(40,150,251,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] disabled:opacity-40 disabled:cursor-not-allowed ml-[12px] shrink-0 transition-shadow duration-300 hover:shadow-[0_4px_30px_rgba(40,150,251,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]"
                >
                  {isGenerating ? (
                    <div className="w-[15px] h-[15px] border-[2px] border-[rgba(255,255,255,0.2)] border-t-white rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-[15px] h-[15px]" />
                  )}
                  {isGenerating ? "Generating..." : "Generate"}
                </motion.button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_1fr] gap-[16px]">
            <div className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-[16px]">
              <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[12px] flex items-center gap-[6px]">
                <SlidersHorizontal className="w-[12px] h-[12px]" />
                Generation Settings
              </div>
              <div className="grid grid-cols-2 gap-[10px]">
                <SelectControl label="Aspect Ratio" value={aspectRatio} options={ASPECT_RATIOS} onChange={setAspectRatio} />
                <SelectControl label="Style" value={stylePreset} options={STYLE_PRESETS} onChange={setStylePreset} />
                <SelectControl label="Quality" value={quality} options={QUALITY_OPTIONS} onChange={setQuality} />
                <div>
                  <div className="text-[10px] font-semibold text-[#64748B] mb-[6px] uppercase tracking-[0.5px]">Outputs</div>
                  <div className="flex gap-[4px]">
                    {[1, 2, 4, 8].map((n) => (
                      <button
                        key={n}
                        onClick={() => setOutputCount(n)}
                        className={`flex-1 py-[7px] rounded-[8px] text-[12px] font-semibold cursor-pointer transition-all duration-200 border
                          ${outputCount === n
                            ? 'bg-[rgba(40,150,251,0.12)] border-[rgba(40,150,251,0.25)] text-[#2896FB]'
                            : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#94A3B8]'
                          }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-[16px]">
              <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[12px] flex items-center gap-[6px]">
                <Sliders className="w-[12px] h-[12px]" />
                Fine Tuning
              </div>
              <div className="flex flex-col gap-[12px]">
                <SliderControl label="Creativity" value={creativity} onChange={setCreativity} />
                <SliderControl label="Brand Adherence" value={brandAdherence} onChange={setBrandAdherence} />
                <SliderControl label="Reference Strength" value={referenceStrength} onChange={setReferenceStrength} />
                <div className="flex items-center justify-between mt-[2px]">
                  <span className="text-[11px] font-medium text-[#64748B]">Transparent Background</span>
                  <button
                    onClick={() => setTransparentBg(!transparentBg)}
                    className="w-[36px] h-[20px] rounded-full border-none cursor-pointer transition-all duration-300 relative"
                    style={{ background: transparentBg ? 'rgba(40,150,251,0.4)' : 'rgba(255,255,255,0.08)' }}
                  >
                    <div
                      className="absolute top-[2px] w-[16px] h-[16px] rounded-full transition-all duration-300 shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
                      style={{
                        left: transparentBg ? '18px' : '2px',
                        background: transparentBg ? '#2896FB' : '#64748B',
                      }}
                    />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-[4px] mt-[10px] text-[10px] font-semibold text-[#475569] bg-transparent border-none cursor-pointer hover:text-[#94A3B8] transition-colors duration-200"
              >
                {showAdvanced ? <ChevronDown className="w-[12px] h-[12px]" /> : <ChevronRight className="w-[12px] h-[12px]" />}
                Advanced Options
              </button>
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-[10px] flex flex-col gap-[8px]">
                      <SelectControl label="Sampler" value="DPM++ 2M" options={["DPM++ 2M", "Euler A", "DDIM", "UniPC"]} onChange={() => {}} />
                      <SliderControl label="Steps" value={30} onChange={() => {}} min={10} max={50} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[10px] flex items-center gap-[6px]">
              <ImageIcon className="w-[12px] h-[12px]" />
              Reference Assets
            </div>
            <div className="flex gap-[10px] overflow-x-auto pb-[4px]">
              {REFERENCE_CARDS.map((ref) => {
                const isActive = activeRefs.includes(ref.id);
                return (
                  <motion.div
                    key={ref.id}
                    onClick={() => toggleRef(ref.id)}
                    whileHover={{ y: -2 }}
                    className={`min-w-[130px] rounded-[14px] border cursor-pointer transition-all duration-300 overflow-hidden shrink-0
                      ${isActive
                        ? 'border-[rgba(40,150,251,0.3)] shadow-[0_0_20px_rgba(40,150,251,0.1)]'
                        : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]'
                      }`}
                  >
                    <div className={`h-[70px] bg-gradient-to-br ${ref.color} relative`}>
                      {isActive && (
                        <div className="absolute top-[6px] right-[6px] w-[18px] h-[18px] rounded-full bg-[#2896FB] flex items-center justify-center">
                          <svg viewBox="0 0 12 12" className="w-[8px] h-[8px]"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="p-[8px] bg-[rgba(255,255,255,0.02)]">
                      <div className="text-[11px] font-semibold text-[#CBD5E1] truncate">{ref.name}</div>
                      <div className="text-[9px] font-medium text-[#475569] mt-[2px]">{ref.tag}</div>
                    </div>
                  </motion.div>
                );
              })}
              <motion.div
                whileHover={{ y: -2 }}
                className="min-w-[130px] h-[110px] rounded-[14px] border border-dashed border-[rgba(255,255,255,0.08)] flex flex-col items-center justify-center gap-[6px] cursor-pointer shrink-0 hover:border-[rgba(40,150,251,0.2)] hover:bg-[rgba(40,150,251,0.03)] transition-all duration-300"
              >
                <Plus className="w-[18px] h-[18px] text-[#475569]" />
                <span className="text-[10px] font-medium text-[#475569]">Add Reference</span>
              </motion.div>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[10px] flex items-center gap-[6px]">
              <Layers className="w-[12px] h-[12px]" />
              Output Presets
            </div>
            <div className="flex gap-[8px] overflow-x-auto pb-[4px]">
              {OUTPUT_PRESETS.map((preset) => {
                const isActive = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setActivePreset(preset.id)}
                    className={`flex items-center gap-[7px] py-[8px] px-[14px] rounded-[10px] border text-[12px] font-medium cursor-pointer transition-all duration-300 whitespace-nowrap shrink-0
                      ${isActive
                        ? 'bg-[rgba(40,150,251,0.1)] border-[rgba(40,150,251,0.25)] text-[#2896FB] shadow-[0_0_16px_rgba(40,150,251,0.12)]'
                        : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8] hover:bg-[rgba(255,255,255,0.04)]'
                      }`}
                  >
                    <preset.icon className="w-[14px] h-[14px]" />
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[12px]">Generating visuals...</div>
                <div className="grid grid-cols-4 gap-[12px]">
                  {Array.from({ length: outputCount }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-[14px] overflow-hidden relative">
                      <div className="absolute inset-0 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[14px]" />
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[rgba(40,150,251,0.05)] to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[24px] h-[24px] border-[2px] border-[rgba(40,150,251,0.2)] border-t-[#2896FB] rounded-full animate-spin" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : hasResults ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center justify-between mb-[12px]">
                  <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569]">Generated Results</div>
                  <span className="text-[11px] text-[#475569]">{MOCK_RESULTS.length} images</span>
                </div>
                <div className="grid grid-cols-3 gap-[12px] pb-[24px]">
                  {MOCK_RESULTS.map((result, i) => (
                    <ResultCard
                      key={result.id}
                      result={result}
                      index={i}
                      isSelected={selectedResult === result.id}
                      onClick={() => setSelectedResult(selectedResult === result.id ? null : result.id)}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-[48px]"
              >
                <div className="relative mb-[20px]">
                  <div className="w-[72px] h-[72px] rounded-[22px] bg-gradient-to-br from-[rgba(40,150,251,0.08)] to-[rgba(0,178,169,0.06)] border border-[rgba(40,150,251,0.12)] flex items-center justify-center">
                    <Wand2 className="w-[30px] h-[30px] text-[rgba(40,150,251,0.4)]" />
                  </div>
                  <div className="absolute -top-[4px] -right-[4px] w-[16px] h-[16px] rounded-full bg-gradient-to-br from-[#2896FB] to-[#095DC3] flex items-center justify-center shadow-[0_0_12px_rgba(40,150,251,0.4)]">
                    <Sparkles className="w-[8px] h-[8px] text-white" />
                  </div>
                </div>
                <div className="text-[15px] font-bold text-white mb-[6px]">Create your first AI visual</div>
                <div className="text-[12px] text-[#64748B] text-center leading-[1.5] max-w-[300px]">
                  Write a prompt, attach references, and generate stunning on-brand visuals in seconds.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedResult !== null && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="border-l border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.015)] backdrop-blur-[20px] overflow-hidden shrink-0"
          >
            <DetailDrawer
              result={MOCK_RESULTS.find(r => r.id === selectedResult)!}
              prompt={prompt}
              onClose={() => setSelectedResult(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SelectControl({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-[#64748B] mb-[6px] uppercase tracking-[0.5px]">{label}</div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full py-[8px] px-[10px] pr-[28px] rounded-[8px] bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.06)] text-[12px] text-[#CBD5E1] outline-none appearance-none cursor-pointer font-inherit transition-all duration-200 focus:border-[rgba(40,150,251,0.25)]"
        >
          {options.map((o) => (
            <option key={o} value={o} className="bg-[#0A1628] text-[#CBD5E1]">{o}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-[8px] top-1/2 -translate-y-1/2 w-[12px] h-[12px] text-[#475569] pointer-events-none" />
      </div>
    </div>
  );
}

function SliderControl({ label, value, onChange, min = 0, max = 100 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div>
      <div className="flex justify-between mb-[4px]">
        <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-[0.5px]">{label}</span>
        <span className="text-[10px] font-bold text-[#94A3B8]">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-[3px] rounded-[4px] bg-[rgba(255,255,255,0.06)] outline-none appearance-none cursor-pointer"
      />
    </div>
  );
}

function ResultCard({ result, index, isSelected, onClick }: { result: typeof MOCK_RESULTS[0]; index: number; isSelected: boolean; onClick: () => void }) {
  const gradients = [
    "from-[#095DC3] via-[#0A3366] to-[#060B16]",
    "from-[#00B2A9] via-[#095DC3] to-[#07223D]",
    "from-[#2896FB] via-[#095DC3] to-[#060B16]",
    "from-[#0A3366] via-[#00B2A9] to-[#095DC3]",
    "from-[#095DC3] via-[#2896FB] to-[#07223D]",
    "from-[#07223D] via-[#095DC3] to-[#00B2A9]",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      onClick={onClick}
      className={`group aspect-square rounded-[14px] relative overflow-hidden cursor-pointer transition-all duration-300
        ${isSelected
          ? 'ring-[2px] ring-[#2896FB] ring-offset-[2px] ring-offset-[#060B16]'
          : 'hover:-translate-y-[2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]'
        }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index % gradients.length]}`} />
      <div className="absolute inset-0 flex items-center justify-center">
        <ImageIcon className="w-[32px] h-[32px] text-[rgba(255,255,255,0.1)]" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.7)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="absolute bottom-0 left-0 right-0 p-[10px] translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <div className="text-[11px] font-semibold text-white mb-[6px]">{result.title}</div>
        <div className="flex gap-[4px]">
          {[
            { icon: Eye, tip: "View" },
            { icon: Shuffle, tip: "Remix" },
            { icon: Copy, tip: "Variations" },
            { icon: Download, tip: "Download" },
          ].map((action) => (
            <button
              key={action.tip}
              onClick={(e) => e.stopPropagation()}
              className="w-[28px] h-[28px] rounded-[8px] border border-[rgba(255,255,255,0.15)] bg-[rgba(0,0,0,0.4)] backdrop-blur-[8px] flex items-center justify-center text-[rgba(255,255,255,0.7)] cursor-pointer transition-all duration-200 hover:bg-[rgba(40,150,251,0.3)] hover:text-white hover:border-[rgba(40,150,251,0.4)]"
              title={action.tip}
            >
              <action.icon className="w-[12px] h-[12px]" />
            </button>
          ))}
        </div>
      </div>

      <div className="absolute top-[8px] right-[8px] py-[3px] px-[8px] rounded-[6px] bg-[rgba(0,0,0,0.4)] backdrop-blur-[8px] border border-[rgba(255,255,255,0.08)] text-[9px] font-semibold text-[rgba(255,255,255,0.6)]">
        {result.status}
      </div>
    </motion.div>
  );
}

function DetailDrawer({ result, prompt, onClose }: { result: typeof MOCK_RESULTS[0]; prompt: string; onClose: () => void }) {
  const gradients = [
    "from-[#095DC3] via-[#0A3366] to-[#060B16]",
    "from-[#00B2A9] via-[#095DC3] to-[#07223D]",
  ];

  return (
    <div className="w-[360px] h-full overflow-y-auto p-[20px] flex flex-col gap-[16px]">
      <div className="flex items-center justify-between">
        <div className="text-[14px] font-bold text-white">{result.title}</div>
        <button
          onClick={onClose}
          className="w-[28px] h-[28px] rounded-[8px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] flex items-center justify-center text-[#64748B] cursor-pointer hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-all duration-200"
        >
          <X className="w-[14px] h-[14px]" />
        </button>
      </div>

      <div className={`aspect-square rounded-[14px] bg-gradient-to-br ${gradients[(result.id - 1) % 2]} relative overflow-hidden`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-[40px] h-[40px] text-[rgba(255,255,255,0.1)]" />
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[6px]">Prompt Used</div>
        <div className="text-[12px] text-[#94A3B8] leading-[1.6] p-[12px] rounded-[10px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.04)]">
          {prompt || "No prompt provided"}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[6px]">Settings</div>
        <div className="grid grid-cols-2 gap-[6px]">
          {[
            ["Aspect", "1:1"],
            ["Style", "Photorealistic"],
            ["Quality", "High"],
            ["Steps", "30"],
          ].map(([k, v]) => (
            <div key={k} className="py-[6px] px-[10px] rounded-[8px] bg-[rgba(0,0,0,0.1)] border border-[rgba(255,255,255,0.04)]">
              <div className="text-[9px] font-semibold text-[#475569] uppercase">{k}</div>
              <div className="text-[12px] font-medium text-[#CBD5E1]">{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-[6px] mt-[4px]">
        {[
          { icon: RefreshCw, label: "Regenerate", primary: true },
          { icon: Copy, label: "Make Variations", primary: false },
          { icon: Wand2, label: "Duplicate Prompt", primary: false },
          { icon: Download, label: "Download", primary: false },
        ].map((action) => (
          <button
            key={action.label}
            className={`flex items-center gap-[8px] py-[9px] px-[14px] rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all duration-200 border
              ${action.primary
                ? 'bg-gradient-to-r from-[rgba(40,150,251,0.12)] to-[rgba(40,150,251,0.06)] border-[rgba(40,150,251,0.2)] text-[#2896FB] hover:from-[rgba(40,150,251,0.18)] hover:to-[rgba(40,150,251,0.1)]'
                : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#94A3B8] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
              }`}
          >
            <action.icon className="w-[14px] h-[14px]" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
