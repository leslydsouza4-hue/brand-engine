import { 
  LayoutTemplate, 
  Image as ImageIcon, 
  User, 
  Video, 
  Gift, 
  Settings, 
  FolderOpen,
  MonitorPlay,
  Mail,
  GraduationCap
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;

const activeClass = 'text-white bg-gradient-to-br from-[rgba(0,178,169,0.12)] to-[rgba(40,150,251,0.08)] shadow-[0_4px_24px_rgba(0,178,169,0.1),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_0_1px_rgba(0,178,169,0.1)] before:content-[""] before:absolute before:-left-[12px] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[22px] before:bg-gradient-to-b before:from-[#00B2A9] before:to-[#2896FB] before:rounded-r-[4px] before:shadow-[0_0_16px_rgba(0,178,169,0.3)]';
const inactiveClass = 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/5 hover:translate-x-[2px]';
const disabledClass = 'text-[#94A3B8] opacity-40 cursor-not-allowed pointer-events-none';
const btnBase = 'w-full flex items-center gap-[12px] py-[11px] px-[14px] rounded-[16px] transition-all duration-250 relative text-[13.5px] font-medium mb-[2px]';

function iconCls(active: boolean) {
  return `w-[18px] h-[18px] shrink-0 transition-all duration-250 ${active ? 'opacity-100 drop-shadow-[0_0_4px_rgba(0,178,169,0.4)]' : 'opacity-60'}`;
}

export function Sidebar({ currentMode, setMode }: { currentMode: string, setMode: (mode: string) => void }) {
  return (
    <nav className="w-[220px] bg-[#030b17a6] backdrop-blur-[28px] saturate-[150%] flex flex-col shrink-0 relative z-10 border-r border-white/5 relative
      before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,178,169,0.06)_0%,transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.02)_0%,transparent_30%)] before:pointer-events-none
      after:content-[''] after:absolute after:top-0 after:right-0 after:w-[1px] after:h-full after:bg-[linear-gradient(to_bottom,rgba(0,178,169,0.2),rgba(40,150,251,0.08),transparent_80%)]
    ">
      <div className="pt-[26px] px-[20px] pb-[32px] flex items-center gap-[11px] relative">
        <div className="w-[36px] h-[36px] rounded-[11px] flex items-center justify-center overflow-hidden shrink-0 relative shadow-[0_0_10px_rgba(0,178,169,0.2),0_0_20px_rgba(40,150,251,0.1)]
          after:content-[''] after:absolute after:inset-[-3px] after:rounded-[14px] after:bg-gradient-to-br after:from-[rgba(0,178,169,0.2)] after:to-[rgba(40,150,251,0.12)] after:-z-10 after:blur-[8px]
        ">
          <img src={`${BASE}assets/logos/Lockup=Icon, Color=Full.png`} alt="HighLevel" className="w-[24px] h-[24px] object-contain" />
        </div>
        <div className="text-[17px] font-bold text-white tracking-[-0.4px]">Brand<span className="text-[#94A3B8] font-normal ml-[1px]">Engine</span></div>
      </div>
      
      <div className="px-[12px] mb-[10px] relative">
        <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Create</div>
        
        <button 
          onClick={() => setMode('templates')}
          className={`${btnBase} cursor-pointer ${currentMode === 'templates' ? activeClass : inactiveClass}`}
        >
          <LayoutTemplate className={iconCls(currentMode === 'templates')} />
          Templates
        </button>
        
        <button 
          onClick={() => setMode('ai-image')}
          className={`${btnBase} cursor-pointer ${currentMode === 'ai-image' ? activeClass : inactiveClass}`}
        >
          <ImageIcon className={iconCls(currentMode === 'ai-image')} />
          AI Image
        </button>
      </div>

      <div className="px-[12px] mb-[10px] relative">
        <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Thumbnails</div>
        
        <button 
          onClick={() => setMode('shaun-thumbnails')}
          className={`${btnBase} cursor-pointer ${currentMode === 'shaun-thumbnails' ? activeClass : inactiveClass}`}
        >
          <User className={iconCls(currentMode === 'shaun-thumbnails')} />
          Shaun Comin Atcha
        </button>

        <div className={`${btnBase} ${disabledClass}`}>
          <MonitorPlay className="w-[18px] h-[18px] shrink-0" />
          Content Army
          <span className="text-[9px] font-semibold bg-white/5 px-[7px] py-[2px] rounded-[6px] ml-auto text-[#64748B]">New</span>
        </div>
      </div>

      <div className="px-[12px] mb-[10px] relative">
        <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Social & Email Packs</div>

        <div className={`${btnBase} ${disabledClass}`}>
          <Gift className="w-[18px] h-[18px] shrink-0" />
          Super Promo
          <span className="text-[9px] font-semibold bg-white/5 px-[7px] py-[2px] rounded-[6px] ml-auto text-[#64748B]">New</span>
        </div>

        <div className={`${btnBase} ${disabledClass}`}>
          <Video className="w-[18px] h-[18px] shrink-0" />
          Virtual Workshop
          <span className="text-[9px] font-semibold bg-white/5 px-[7px] py-[2px] rounded-[6px] ml-auto text-[#64748B]">New</span>
        </div>

        <div className={`${btnBase} ${disabledClass}`}>
          <GraduationCap className="w-[18px] h-[18px] shrink-0" />
          Master Class
          <span className="text-[9px] font-semibold bg-white/5 px-[7px] py-[2px] rounded-[6px] ml-auto text-[#64748B]">New</span>
        </div>
      </div>

      <div className="px-[12px] mb-[10px] relative">
        <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Backgrounds</div>

        <button 
          onClick={() => setMode('zoom-backgrounds')}
          className={`${btnBase} cursor-pointer ${currentMode === 'zoom-backgrounds' ? activeClass : inactiveClass}`}
        >
          <Mail className={iconCls(currentMode === 'zoom-backgrounds')} />
          Zoom Backgrounds
        </button>
      </div>

      <div className="mt-auto px-[12px] py-[16px] border-t border-white/5">
        <button 
          onClick={() => setMode('settings')}
          className={`w-full flex items-center gap-[12px] py-[11px] px-[14px] rounded-[16px] cursor-pointer transition-all duration-250 text-[13px] font-medium mb-[2px]
            ${currentMode === 'settings'
              ? 'text-white bg-gradient-to-br from-[rgba(0,178,169,0.12)] to-[rgba(40,150,251,0.08)] shadow-[0_4px_24px_rgba(0,178,169,0.1),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_0_1px_rgba(0,178,169,0.1)]'
              : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/5 hover:translate-x-[2px]'
            }`}
        >
          <Settings className={`w-[18px] h-[18px] shrink-0 transition-all duration-250 ${currentMode === 'settings' ? 'opacity-100 drop-shadow-[0_0_4px_rgba(0,178,169,0.4)]' : 'opacity-60'}`} />
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
