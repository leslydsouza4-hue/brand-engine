import { 
  LayoutTemplate, 
  Image as ImageIcon, 
  User, 
  Video, 
  Award, 
  Gift, 
  Settings, 
  FolderOpen,
  Hexagon,
  MonitorPlay
} from "lucide-react";

export function Sidebar({ currentMode, setMode }: { currentMode: string, setMode: (mode: string) => void }) {
  return (
    <nav className="w-[220px] bg-[#030b17a6] backdrop-blur-[28px] saturate-[150%] flex flex-col shrink-0 relative z-10 border-r border-white/5 relative
      before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,178,169,0.06)_0%,transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.02)_0%,transparent_30%)] before:pointer-events-none
      after:content-[''] after:absolute after:top-0 after:right-0 after:w-[1px] after:h-full after:bg-[linear-gradient(to_bottom,rgba(0,178,169,0.2),rgba(40,150,251,0.08),transparent_80%)]
    ">
      <div className="pt-[26px] px-[20px] pb-[32px] flex items-center gap-[11px] relative">
        <div className="w-[36px] h-[36px] bg-gradient-to-br from-[#095DC3] via-[#2896FB] to-[#00B2A9] rounded-[11px] flex items-center justify-center shadow-[0_0_24px_rgba(0,178,169,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] relative
          after:content-[''] after:absolute after:inset-[-2px] after:rounded-[13px] after:bg-gradient-to-br after:from-[rgba(0,178,169,0.35)] after:to-[rgba(40,150,251,0.2)] after:-z-10 after:blur-[6px]
        ">
          <Hexagon className="w-[18px] h-[18px] text-white" />
        </div>
        <div className="text-[17px] font-bold text-white tracking-[-0.4px]">Brand<span className="text-[#94A3B8] font-normal ml-[1px]">Engine</span></div>
      </div>
      
      <div className="px-[12px] mb-[10px] relative">
        <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Create</div>
        
        <button 
          onClick={() => setMode('templates')}
          className={`w-full flex items-center gap-[12px] py-[11px] px-[14px] rounded-[16px] cursor-pointer transition-all duration-250 relative text-[13.5px] font-medium mb-[2px]
            ${currentMode === 'templates' 
              ? 'text-white bg-gradient-to-br from-[rgba(0,178,169,0.12)] to-[rgba(40,150,251,0.08)] shadow-[0_4px_24px_rgba(0,178,169,0.1),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_0_1px_rgba(0,178,169,0.1)] before:content-[""] before:absolute before:-left-[12px] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[22px] before:bg-gradient-to-b before:from-[#00B2A9] before:to-[#2896FB] before:rounded-r-[4px] before:shadow-[0_0_16px_rgba(0,178,169,0.3)]'
              : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/5 hover:translate-x-[2px]'
            }`}
        >
          <LayoutTemplate className={`w-[18px] h-[18px] shrink-0 transition-all duration-250 ${currentMode === 'templates' ? 'opacity-100 drop-shadow-[0_0_4px_rgba(0,178,169,0.4)]' : 'opacity-60 group-hover:opacity-90'}`} />
          Templates
        </button>
        
        <button 
          onClick={() => setMode('ai-image')}
          className={`w-full flex items-center gap-[12px] py-[11px] px-[14px] rounded-[16px] cursor-pointer transition-all duration-250 relative text-[13.5px] font-medium mb-[2px]
            ${currentMode === 'ai-image' 
              ? 'text-white bg-gradient-to-br from-[rgba(0,178,169,0.12)] to-[rgba(40,150,251,0.08)] shadow-[0_4px_24px_rgba(0,178,169,0.1),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_0_1px_rgba(0,178,169,0.1)] before:content-[""] before:absolute before:-left-[12px] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[22px] before:bg-gradient-to-b before:from-[#00B2A9] before:to-[#2896FB] before:rounded-r-[4px] before:shadow-[0_0_16px_rgba(0,178,169,0.3)]'
              : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/5 hover:translate-x-[2px]'
            }`}
        >
          <ImageIcon className={`w-[18px] h-[18px] shrink-0 transition-all duration-250 ${currentMode === 'ai-image' ? 'opacity-100 drop-shadow-[0_0_4px_rgba(0,178,169,0.4)]' : 'opacity-60 group-hover:opacity-90'}`} />
          AI Image
        </button>
      </div>

      <div className="px-[12px] mb-[10px] relative">
        <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Creative Packs</div>
        
        <button 
          onClick={() => setMode('shaun-thumbnails')}
          className={`w-full flex items-center gap-[12px] py-[11px] px-[14px] rounded-[16px] cursor-pointer transition-all duration-250 relative text-[13.5px] font-medium mb-[2px]
            ${currentMode === 'shaun-thumbnails' 
              ? 'text-white bg-gradient-to-br from-[rgba(0,178,169,0.12)] to-[rgba(40,150,251,0.08)] shadow-[0_4px_24px_rgba(0,178,169,0.1),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_0_1px_rgba(0,178,169,0.1)] before:content-[""] before:absolute before:-left-[12px] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[22px] before:bg-gradient-to-b before:from-[#00B2A9] before:to-[#2896FB] before:rounded-r-[4px] before:shadow-[0_0_16px_rgba(0,178,169,0.3)]'
              : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/5 hover:translate-x-[2px]'
            }`}
        >
          <User className={`w-[18px] h-[18px] shrink-0 transition-all duration-250 ${currentMode === 'shaun-thumbnails' ? 'opacity-100 drop-shadow-[0_0_4px_rgba(0,178,169,0.4)]' : 'opacity-60 group-hover:opacity-90'}`} />
          Shaun Comin Atcha
        </button>

        <button 
          onClick={() => setMode('zoom-backgrounds')}
          className={`w-full flex items-center gap-[12px] py-[11px] px-[14px] rounded-[16px] cursor-pointer transition-all duration-250 relative text-[13.5px] font-medium mb-[2px]
            ${currentMode === 'zoom-backgrounds' 
              ? 'text-white bg-gradient-to-br from-[rgba(0,178,169,0.12)] to-[rgba(40,150,251,0.08)] shadow-[0_4px_24px_rgba(0,178,169,0.1),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_0_1px_rgba(0,178,169,0.1)] before:content-[""] before:absolute before:-left-[12px] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[22px] before:bg-gradient-to-b before:from-[#00B2A9] before:to-[#2896FB] before:rounded-r-[4px] before:shadow-[0_0_16px_rgba(0,178,169,0.3)]'
              : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/5 hover:translate-x-[2px]'
            }`}
        >
          <Video className={`w-[18px] h-[18px] shrink-0 transition-all duration-250 ${currentMode === 'zoom-backgrounds' ? 'opacity-100 drop-shadow-[0_0_4px_rgba(0,178,169,0.4)]' : 'opacity-60 group-hover:opacity-90'}`} />
          Zoom Backgrounds
        </button>

        <div className="w-full flex items-center gap-[12px] py-[11px] px-[14px] rounded-[16px] text-[#94A3B8] opacity-40 cursor-not-allowed pointer-events-none relative text-[13.5px] font-medium mb-[2px]">
          <MonitorPlay className="w-[18px] h-[18px] shrink-0" />
          Content Army
          <span className="text-[9px] font-semibold bg-white/5 px-[7px] py-[2px] rounded-[6px] ml-auto text-[#64748B]">Soon</span>
        </div>

        <div className="w-full flex items-center gap-[12px] py-[11px] px-[14px] rounded-[16px] text-[#94A3B8] opacity-40 cursor-not-allowed pointer-events-none relative text-[13.5px] font-medium mb-[2px]">
          <Gift className="w-[18px] h-[18px] shrink-0" />
          Super Promo
          <span className="text-[9px] font-semibold bg-white/5 px-[7px] py-[2px] rounded-[6px] ml-auto text-[#64748B]">Soon</span>
        </div>

        <div className="w-full flex items-center gap-[12px] py-[11px] px-[14px] rounded-[16px] text-[#94A3B8] opacity-40 cursor-not-allowed pointer-events-none relative text-[13.5px] font-medium mb-[2px]">
          <LayoutTemplate className="w-[18px] h-[18px] shrink-0" />
          Master Class
          <span className="text-[9px] font-semibold bg-white/5 px-[7px] py-[2px] rounded-[6px] ml-auto text-[#64748B]">Soon</span>
        </div>

        <div className="w-full flex items-center gap-[12px] py-[11px] px-[14px] rounded-[16px] text-[#94A3B8] opacity-40 cursor-not-allowed pointer-events-none relative text-[13.5px] font-medium mb-[2px]">
          <Award className="w-[18px] h-[18px] shrink-0" />
          Certified Admin
          <span className="text-[9px] font-semibold bg-white/5 px-[7px] py-[2px] rounded-[6px] ml-auto text-[#64748B]">Soon</span>
        </div>
      </div>

      <div className="mt-auto px-[12px] py-[16px] border-t border-white/5">
        <button className="w-full flex items-center gap-[12px] py-[11px] px-[14px] rounded-[16px] cursor-pointer transition-all duration-250 text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/5 hover:translate-x-[2px] text-[13px] font-medium mb-[2px]">
          <Settings className="w-[18px] h-[18px] shrink-0 opacity-60" />
          Settings
        </button>
        <button 
          onClick={() => setMode('brand-directory')}
          className={`w-full flex items-center gap-[12px] py-[11px] px-[14px] rounded-[16px] cursor-pointer transition-all duration-250 text-[13px] font-medium mb-[2px]
            ${currentMode === 'brand-directory'
              ? 'text-white bg-gradient-to-br from-[rgba(0,178,169,0.12)] to-[rgba(40,150,251,0.08)] shadow-[0_4px_24px_rgba(0,178,169,0.1),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_0_1px_rgba(0,178,169,0.1)]'
              : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/5 hover:translate-x-[2px]'
            }`}
        >
          <FolderOpen className={`w-[18px] h-[18px] shrink-0 transition-all duration-250 ${currentMode === 'brand-directory' ? 'opacity-100 drop-shadow-[0_0_4px_rgba(0,178,169,0.4)]' : 'opacity-60'}`} />
          Brand Directory
        </button>
      </div>
    </nav>
  );
}
