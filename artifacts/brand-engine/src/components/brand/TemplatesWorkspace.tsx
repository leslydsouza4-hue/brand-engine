import { useState } from "react";
import { LayoutTemplate, MonitorPlay, Presentation, type LucideIcon } from "lucide-react";

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

const CATEGORIES: Category[] = [
  {
    id: "social",
    name: "Social",
    icon: LayoutTemplate,
    sizes: [
      { id: "square", name: "Instagram Square (1080x1080)", ratio: 1 },
      { id: "portrait", name: "Instagram Portrait (1080x1350)", ratio: 1080/1350 },
      { id: "story", name: "Story / Reel (1080x1920)", ratio: 1080/1920 },
      { id: "landscape", name: "Twitter / FB Landscape (1200x628)", ratio: 1200/628 }
    ]
  },
  {
    id: "ads",
    name: "Ads",
    icon: MonitorPlay,
    sizes: [
      { id: "leaderboard", name: "Leaderboard (728x90)", ratio: 728/90 },
      { id: "med-rect", name: "Medium Rectangle (300x250)", ratio: 300/250 },
      { id: "wide-banner", name: "Wide Banner (1200x628)", ratio: 1200/628 },
      { id: "yt-thumb", name: "YouTube Thumbnail (1280x720)", ratio: 1280/720 }
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

const TEMPLATES = [
  {
    id: "bold-statement",
    name: "Bold Statement",
    background: "linear-gradient(135deg, #095DC3 0%, #2896FB 50%, #00B2A9 100%)",
    category: "Brand Core"
  },
  {
    id: "planet-promo",
    name: "Planet Promo",
    background: "radial-gradient(circle at 100% 0%, #2896FB 0%, #07223D 60%, #030B17 100%)",
    category: "Product"
  },
  {
    id: "radial-focus",
    name: "Radial Focus",
    background: "radial-gradient(circle at 50% 50%, #00B2A9 0%, #07223D 70%, #030B17 100%)",
    category: "Event"
  },
  {
    id: "clean-gradient",
    name: "Clean Gradient",
    background: "linear-gradient(180deg, #0A3366 0%, #07223D 100%)",
    category: "Minimal"
  }
];

export function TemplatesWorkspace() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [activeSize, setActiveSize] = useState(CATEGORIES[0].sizes[0]);
  const [activeTemplate, setActiveTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");

  const handleCategoryChange = (cat: Category) => {
    setActiveCategory(cat);
    setActiveSize(cat.sizes[0]);
  };

  return (
    <div className="flex flex-1 overflow-hidden p-0 gap-0">
      
      {/* Left Controls */}
      <div className="w-[400px] min-w-[400px] overflow-y-auto overflow-x-hidden py-[16px] px-[24px] pb-[28px] border-r border-[rgba(255,255,255,0.04)] flex flex-col">
        <div className="text-[14px] font-bold text-white mb-[1px]">Create something new</div>
        <div className="text-[11.5px] text-[#475569] mb-[16px]">Pick a format, size, then a template.</div>
        
        <div className="flex gap-[8px] mb-[16px]">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory.id === cat.id;
            return (
              <div 
                key={cat.id}
                onClick={() => handleCategoryChange(cat)}
                className={`flex-1 flex flex-col items-center gap-[8px] pt-[14px] px-[8px] pb-[12px] bg-[rgba(255,255,255,0.015)] border rounded-[12px] cursor-pointer transition-all duration-300 relative overflow-hidden group
                  ${isActive 
                    ? 'border-[rgba(0,178,169,0.25)] bg-[rgba(255,255,255,0.025)] shadow-[0_6px_24px_rgba(0,0,0,0.2)] after:opacity-100 after:scale-x-100' 
                    : 'border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.07)] hover:-translate-y-[2px] after:opacity-0 after:scale-x-0'}
                  after:content-[""] after:absolute after:bottom-0 after:left-[20%] after:right-[20%] after:h-[2px] after:bg-[#00B2A9] after:transition-all after:duration-300`}
              >
                <div className={`w-[36px] h-[36px] rounded-[10px] border flex items-center justify-center transition-all
                  ${isActive ? 'bg-[rgba(0,178,169,0.1)] border-[rgba(0,178,169,0.2)]' : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.04)]'}`}>
                  <Icon className={`w-[16px] h-[16px] ${isActive ? 'text-[#00B2A9]' : 'text-[#64748B]'}`} />
                </div>
                <div className={`text-[11px] font-semibold ${isActive ? 'text-white' : 'text-[#64748B]'}`}>{cat.name}</div>
              </div>
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
          {TEMPLATES.map((tpl, i) => {
            const isActive = activeTemplate?.id === tpl.id;
            return (
              <div 
                key={tpl.id}
                onClick={() => setActiveTemplate(tpl)}
                style={{ animationDelay: `${i * 0.05}s` }}
                className={`rounded-[12px] overflow-hidden bg-[rgba(255,255,255,0.015)] border cursor-pointer transition-all duration-300 relative animate-[tplCardReveal_0.4s_ease_backwards]
                  ${isActive 
                    ? 'border-[rgba(0,178,169,0.35)] shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_24px_rgba(0,178,169,0.12)]' 
                    : 'border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.08)] hover:-translate-y-[4px] hover:scale-[1.03] hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]'}`}
              >
                <div 
                  className="w-full max-h-[180px] relative overflow-hidden flex items-center justify-center"
                  style={{ aspectRatio: activeSize.ratio }}
                >
                  <div className="absolute inset-0 z-0" style={{ background: tpl.background }}></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-[14px] text-center z-[2]">
                    <div className="font-['Poppins'] font-extrabold text-[10px] uppercase text-[rgba(255,255,255,0.85)] drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">TEXT HERE</div>
                    <div className="text-[7px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-[1.2px] mt-[3px]">HighLevel</div>
                  </div>
                </div>
                <div className="py-[8px] px-[10px] flex items-center justify-between bg-[rgba(255,255,255,0.02)]">
                  <div className={`text-[10px] font-semibold ${isActive ? 'text-[rgba(0,178,169,0.8)]' : 'text-[#64748B]'}`}>{tpl.name}</div>
                  <div className="text-[9px] text-[#475569]">{tpl.category}</div>
                </div>
              </div>
            );
          })}
        </div>

        {activeTemplate && (
          <div className="flex flex-col gap-[12px] mt-[16px] pt-[16px] border-t border-[rgba(255,255,255,0.04)] animate-in fade-in duration-300">
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
          </div>
        )}
      </div>

      {/* Right Preview */}
      <div className="flex-1 flex flex-col min-w-0 py-[20px] px-[24px] pb-[24px]">
        <div className="flex items-center justify-between pb-[14px]">
          <div className="text-[13px] font-medium text-[#64748B] flex items-center gap-[9px]">
            <div className="w-[8px] h-[8px] rounded-full bg-[#00B2A9] shadow-[0_0_10px_rgba(0,178,169,0.4)] animate-[pulse-dot_2s_infinite]"></div>
            Live Preview
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center relative overflow-hidden rounded-[16px]">
          <div 
            className="relative w-full max-w-[680px] mx-auto rounded-[14px] overflow-hidden bg-[rgba(255,255,255,0.01)] transition-all duration-500 z-[2]"
            style={{ 
              aspectRatio: activeSize.ratio,
              boxShadow: activeTemplate ? '0 8px 50px rgba(0,0,0,0.3)' : 'none'
            }}
          >
            {activeTemplate ? (
              <>
                <div className="absolute top-[12px] right-[12px] py-[4px] px-[10px] bg-[rgba(0,0,0,0.5)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.08)] rounded-[6px] text-[9px] font-semibold text-[rgba(255,255,255,0.5)] z-[10] pointer-events-none">
                  {activeSize.ratio > 1 ? `${Math.round(activeSize.ratio * 1080)}×1080` : `1080×${Math.round(1080 / activeSize.ratio)}`}
                </div>
                <div className="absolute inset-0 z-0 transition-all duration-500" style={{ background: activeTemplate.background }}></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-[10%] text-center z-[3]">
                  <div className="font-['Poppins'] font-black text-[clamp(20px,3.5vw,44px)] uppercase text-white leading-[0.93] drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)]">
                    {headline || "YOUR TEXT HERE"}
                  </div>
                  <div className="text-[clamp(10px,1.5vw,16px)] font-bold text-[rgba(255,255,255,0.45)] uppercase tracking-[2.5px] mt-[10px]">
                    {subtext || "HighLevel"}
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-[2]">
                <div className="w-[64px] h-[64px] rounded-[20px] bg-gradient-to-br from-[rgba(0,178,169,0.08)] to-[rgba(9,93,195,0.08)] border border-[rgba(0,178,169,0.1)] flex items-center justify-center mb-[20px]">
                  <LayoutTemplate className="w-[28px] h-[28px] text-[rgba(0,178,169,0.5)]" />
                </div>
                <div className="text-[16px] font-bold text-white mb-[6px]">Start creating</div>
                <div className="text-[12.5px] text-[#64748B] mb-[24px] text-center leading-[1.5]">
                  Select a format and template to build<br/>beautiful HighLevel assets in seconds
                </div>
                <button 
                  onClick={() => setActiveTemplate(TEMPLATES[0])}
                  className="py-[10px] px-[24px] bg-gradient-to-br from-[rgba(0,178,169,0.12)] to-[rgba(0,178,169,0.06)] border border-[rgba(0,178,169,0.2)] rounded-[10px] font-inherit text-[12px] font-semibold text-[#00B2A9] cursor-pointer mb-[40px] hover:bg-[rgba(0,178,169,0.1)]"
                >
                  Choose a Template
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
