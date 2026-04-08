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
  GraduationCap,
  X
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;

const activeClass = 'text-white bg-gradient-to-br from-[rgba(0,178,169,0.12)] to-[rgba(40,150,251,0.08)] shadow-[0_4px_24px_rgba(0,178,169,0.1),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_0_1px_rgba(0,178,169,0.1)] before:content-[""] before:absolute before:-left-[12px] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[22px] before:bg-gradient-to-b before:from-[#00B2A9] before:to-[#2896FB] before:rounded-r-[4px] before:shadow-[0_0_16px_rgba(0,178,169,0.3)]';
const inactiveClass = 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/5 hover:translate-x-[2px]';
const disabledClass = 'text-[#94A3B8] opacity-40 cursor-not-allowed pointer-events-none';
const btnBase = 'w-full flex items-center gap-[12px] py-[11px] px-[14px] rounded-[16px] transition-all duration-250 relative text-[13.5px] font-medium mb-[2px]';

function iconCls(active: boolean) {
  return `w-[18px] h-[18px] shrink-0 transition-all duration-250 ${active ? 'opacity-100 drop-shadow-[0_0_4px_rgba(0,178,169,0.4)]' : 'opacity-60'}`;
}

interface SidebarProps {
  currentMode: string;
  setMode: (mode: string) => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ currentMode, setMode, mobileOpen, onClose }: SidebarProps) {
  const handleSetMode = (mode: string) => {
    setMode(mode);
    onClose?.();
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose} />
      )}
      <nav className={`
        bg-[#030b17f0] backdrop-blur-[28px] saturate-[150%] flex flex-col shrink-0 relative z-50 border-r border-white/5
        before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,178,169,0.06)_0%,transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.02)_0%,transparent_30%)] before:pointer-events-none
        after:content-[''] after:absolute after:top-0 after:right-0 after:w-[1px] after:h-full after:bg-[linear-gradient(to_bottom,rgba(0,178,169,0.2),rgba(40,150,251,0.08),transparent_80%)]
        fixed inset-y-0 left-0 w-[260px] transition-transform duration-300 ease-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:w-[220px]
      `}>
        <div className="pt-[26px] px-[20px] pb-[20px] flex items-center gap-[11px] relative shrink-0">
          <div className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center shrink-0 relative bg-white/[0.04] backdrop-blur-[12px] border border-white/[0.08]">
            <img src={`${BASE}assets/logos/Lockup=Icon, Color=Full.png`} alt="HighLevel" className="w-[18px] h-[18px] object-contain" />
          </div>
          <div className="text-[17px] font-bold text-white tracking-[-0.4px] flex-1">Brand<span className="text-[#94A3B8] font-normal ml-[1px]">Engine</span></div>
          <button onClick={onClose} className="md:hidden w-[28px] h-[28px] flex items-center justify-center rounded-[8px] text-[#94A3B8] hover:text-white hover:bg-white/10 transition-all cursor-pointer">
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll">
        <div className="px-[12px] mb-[10px] relative">
          <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Create</div>
          
          <button 
            onClick={() => handleSetMode('templates')}
            className={`${btnBase} cursor-pointer ${currentMode === 'templates' ? activeClass : inactiveClass}`}
          >
            <LayoutTemplate className={iconCls(currentMode === 'templates')} />
            Templates
          </button>
          
          <button 
            onClick={() => handleSetMode('ai-image')}
            className={`${btnBase} cursor-pointer ${currentMode === 'ai-image' ? activeClass : inactiveClass}`}
          >
            <ImageIcon className={iconCls(currentMode === 'ai-image')} />
            AI Image
          </button>
        </div>

        <div className="px-[12px] mb-[10px] relative">
          <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Thumbnails</div>
          
          <button 
            onClick={() => handleSetMode('shaun-thumbnails')}
            className={`${btnBase} cursor-pointer ${currentMode === 'shaun-thumbnails' ? activeClass : inactiveClass}`}
          >
            <User className={iconCls(currentMode === 'shaun-thumbnails')} />
            Shaun Comin Atcha
          </button>

          <div className={`${btnBase} ${disabledClass}`}>
            <MonitorPlay className="w-[18px] h-[18px] shrink-0" />
            Content Army
            <span className="text-[7px] font-medium bg-white/5 px-[5px] py-[1px] rounded-[4px] ml-auto text-[#64748B] uppercase tracking-[0.5px]">Soon</span>
          </div>
        </div>

        <div className="px-[12px] mb-[10px] relative">
          <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Social & Email Packs</div>

          <div className={`${btnBase} ${disabledClass}`}>
            <Gift className="w-[18px] h-[18px] shrink-0" />
            Super Promo
            <span className="text-[7px] font-medium bg-white/5 px-[5px] py-[1px] rounded-[4px] ml-auto text-[#64748B] uppercase tracking-[0.5px]">Soon</span>
          </div>

          <div className={`${btnBase} ${disabledClass}`}>
            <Video className="w-[18px] h-[18px] shrink-0" />
            Virtual Workshop
            <span className="text-[7px] font-medium bg-white/5 px-[5px] py-[1px] rounded-[4px] ml-auto text-[#64748B] uppercase tracking-[0.5px]">Soon</span>
          </div>

          <div className={`${btnBase} ${disabledClass}`}>
            <GraduationCap className="w-[18px] h-[18px] shrink-0" />
            Master Class
            <span className="text-[7px] font-medium bg-white/5 px-[5px] py-[1px] rounded-[4px] ml-auto text-[#64748B] uppercase tracking-[0.5px]">Soon</span>
          </div>
        </div>

        <div className="px-[12px] mb-[10px] relative">
          <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Backgrounds</div>

          <button 
            onClick={() => handleSetMode('zoom-backgrounds')}
            className={`${btnBase} cursor-pointer ${currentMode === 'zoom-backgrounds' ? activeClass : inactiveClass}`}
          >
            <Mail className={iconCls(currentMode === 'zoom-backgrounds')} />
            Zoom Backgrounds
          </button>

          <div className={`${btnBase} ${disabledClass}`}>
            <Video className="w-[18px] h-[18px] shrink-0" />
            Swoosh Backgrounds
            <span className="text-[7px] font-medium bg-white/5 px-[5px] py-[1px] rounded-[4px] ml-auto text-[#64748B] uppercase tracking-[0.5px]">Soon</span>
          </div>
        </div>

        </div>

        <div className="shrink-0 px-[12px] py-[16px] border-t border-white/5">
          <button 
            onClick={() => handleSetMode('settings')}
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
            onClick={() => handleSetMode('brand-directory')}
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
    </>
  );
}
