import { 
  Sparkles,
  User, 
  Video, 
  Gift, 
  FolderOpen,
  MonitorPlay,
  Lightbulb,
  X,
  FileText,
  Map,
  CalendarDays,
  Mic2,
  Award,
  Clock,
  Trophy,
  Megaphone,
  MessageSquarePlus,
  Mail,
  RefreshCw,
  GraduationCap,
  Folder,
  Wand2,
  ChevronDown,
  Check,
  PlayCircle,
  Scissors,
  Share2,
  Images
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useBrandMode, BRAND_THEMES, type BrandMode } from "./brandModeStore";
import { SUMMER_THEMES, SUMMER_THEME_ORDER, SUMMER_SECTIONS, type SummerThemeId, type SummerSection } from "./summerThemes";

/** Launch timeline shown on each Summer theme tab. */
const SUMMER_TIMELINE: Record<SummerThemeId, { month: string; dates: string }> = {
  "sun-drunk": { month: "June", dates: "Jun 1 – 30" },
  electric: { month: "July", dates: "Jul 1 – 31" },
  feral: { month: "August", dates: "Aug 1 – 31" },
};

const SUMMER_SECTION_ICON = { emailers: Mail, ads: Megaphone, social: Share2, assets: Images } as const;

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
  summerSection?: SummerSection;
  setSummerSection?: (s: SummerSection) => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ currentMode, setMode, summerSection = "emailers", setSummerSection, mobileOpen, onClose }: SidebarProps) {
  const [brandMode, setBrandMode] = useBrandMode();
  const theme = BRAND_THEMES[brandMode];
  const handleSetMode = (mode: string) => {
    setMode(mode);
    onClose?.();
  };
  const isLU = brandMode === "levelup26";
  const isSummer = brandMode === "summer-of-ai";

  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const brandMenuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!brandMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!brandMenuRef.current?.contains(e.target as Node)) setBrandMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setBrandMenuOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [brandMenuOpen]);

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
        md:relative md:translate-x-0 md:w-[220px] md:h-screen
      `}>
        <div className="pt-[22px] px-[20px] pb-[12px] flex items-center gap-[11px] relative shrink-0">
          <div className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center shrink-0 relative bg-white/[0.04] backdrop-blur-[12px] border border-white/[0.08]">
            <img src={theme.logoIconUrl} alt={theme.name} className="w-[18px] h-[18px] object-contain" />
          </div>
          <div className="text-[17px] font-bold text-white tracking-[-0.4px] flex-1">Brand<span className="text-[#94A3B8] font-normal ml-[1px]">Engine</span></div>
          <button onClick={onClose} className="md:hidden w-[28px] h-[28px] flex items-center justify-center rounded-[8px] text-[#94A3B8] hover:text-white hover:bg-white/10 transition-all cursor-pointer">
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        <div className="px-[14px] pb-[14px] shrink-0">
          <div ref={brandMenuRef} className="relative">
            {/* Trigger — stylish rounded pill */}
            <button
              onClick={() => setBrandMenuOpen((v) => !v)}
              className="w-full flex items-center gap-[10px] pl-[8px] pr-[12px] py-[7px] rounded-full border cursor-pointer transition-all duration-200 hover:brightness-[1.08]"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
                borderColor: brandMenuOpen ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.25), 0 6px 18px rgba(0,0,0,0.3)",
              }}
            >
              {/* Brand icon */}
              {isLU ? (
                <img
                  src={`${BASE}assets/levelup26/logo-pill.png`}
                  alt=""
                  className="w-[28px] h-[28px] rounded-[7px] shrink-0 object-cover"
                  style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)" }}
                />
              ) : (
                <span
                  className="relative w-[26px] h-[26px] rounded-full shrink-0 overflow-hidden flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #0B1530 0%, #0A1024 100%)",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.06)",
                  }}
                >
                  <img src={theme.logoIconUrl} alt="" className="relative z-10 w-[16px] h-[16px] object-contain" />
                  <span
                    aria-hidden
                    className="absolute inset-0 opacity-70 pointer-events-none"
                    style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 55%)" }}
                  />
                </span>
              )}
              <span className="flex-1 text-left text-[13px] font-bold text-white tracking-[-0.1px]" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}>
                {theme.name}
              </span>
              <ChevronDown
                className="w-[14px] h-[14px] text-[#94A3B8] transition-transform duration-200 shrink-0"
                style={{ transform: brandMenuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            {/* Menu */}
            {brandMenuOpen && (
              <div
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] p-[5px] rounded-[14px] border backdrop-blur-[20px]"
                style={{
                  background: "rgba(8,12,22,0.96)",
                  borderColor: "rgba(255,255,255,0.09)",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                {(Object.keys(BRAND_THEMES) as BrandMode[]).map((m) => {
                  const t = BRAND_THEMES[m];
                  const active = brandMode === m;
                  return (
                    <button
                      key={m}
                      onClick={() => { setBrandMode(m); setBrandMenuOpen(false); }}
                      className="w-full flex items-center gap-[10px] pl-[7px] pr-[10px] py-[7px] rounded-[10px] cursor-pointer transition-colors duration-150 hover:bg-white/[0.06]"
                      style={{ background: active ? "rgba(255,255,255,0.04)" : "transparent" }}
                    >
                      {m === "levelup26" ? (
                        <img
                          src={`${BASE}assets/levelup26/logo-pill.png`}
                          alt=""
                          className="w-[24px] h-[24px] rounded-[6px] shrink-0 object-cover"
                          style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.08)" }}
                        />
                      ) : (
                        <span
                          className="relative w-[22px] h-[22px] rounded-full shrink-0 overflow-hidden flex items-center justify-center"
                          style={{
                            background: "linear-gradient(135deg, #0B1530 0%, #0A1024 100%)",
                            boxShadow: "0 3px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.06)",
                          }}
                        >
                          <img src={t.logoIconUrl} alt="" className="relative z-10 w-[14px] h-[14px] object-contain" />
                          <span
                            aria-hidden
                            className="absolute inset-0 opacity-70 pointer-events-none"
                            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 55%)" }}
                          />
                        </span>
                      )}
                      <span
                        className="flex-1 text-left text-[12px] font-bold tracking-[-0.1px] whitespace-nowrap"
                        style={{ color: active ? "#FFFFFF" : "#CBD5E1" }}
                      >
                        {t.name}
                      </span>
                      {active && <Check className="w-[13px] h-[13px] shrink-0" style={{ color: "#FFFFFF" }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll">
        {isLU && (
          <div className="px-[12px] mb-[10px] relative">
            <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">LevelUp 26</div>
            <button
              onClick={() => handleSetMode('image-library')}
              className={`group relative w-full flex items-center gap-[10px] px-[14px] py-[10px] rounded-[12px] cursor-pointer border-none transition-all duration-250 ${
                currentMode === 'image-library'
                  ? 'bg-white/[0.05] text-white'
                  : 'text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white hover:translate-x-[2px]'
              }`}
            >
              {currentMode === 'image-library' && (
                <span aria-hidden className="absolute -left-[12px] top-1/2 -translate-y-1/2 w-[3px] h-[20px] rounded-r-[4px]" style={{ background: `linear-gradient(180deg, ${theme.primary}, ${theme.accent})` }} />
              )}
              <span className="w-[24px] h-[24px] rounded-[7px] flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}>
                <Folder className="w-[12px] h-[12px] text-white" />
              </span>
              <span className="flex-1 text-left text-[13px] font-semibold tracking-[-0.1px]">Image Library</span>
            </button>
            <button
              onClick={() => handleSetMode('social-composer')}
              className={`group relative w-full flex items-center gap-[10px] px-[14px] py-[10px] rounded-[12px] cursor-pointer border-none transition-all duration-250 mt-[2px] ${
                currentMode === 'social-composer'
                  ? 'bg-white/[0.05] text-white'
                  : 'text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white hover:translate-x-[2px]'
              }`}
            >
              {currentMode === 'social-composer' && (
                <span aria-hidden className="absolute -left-[12px] top-1/2 -translate-y-1/2 w-[3px] h-[20px] rounded-r-[4px]" style={{ background: `linear-gradient(180deg, ${theme.accent}, ${theme.cta})` }} />
              )}
              <span className="w-[24px] h-[24px] rounded-[7px] flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.cta})` }}>
                <Wand2 className="w-[12px] h-[12px] text-white" />
              </span>
              <span className="flex-1 text-left text-[13px] font-semibold tracking-[-0.1px]">Social Composer</span>
              <span className="text-[8.5px] font-bold tracking-[0.12em] uppercase px-[6px] py-[2px] rounded-[4px]" style={{ color: theme.cta, background: `${theme.cta}1f`, border: `1px solid ${theme.cta}4d` }}>New</span>
            </button>
            <div className="px-[14px] py-[14px] mt-[8px] rounded-[12px] bg-white/[0.02] border border-white/[0.06]">
              <div className="text-[11px] text-[#94A3B8] leading-[1.5]">
                A separate brand world for the LevelUp 26 summit. Templates here use the LU26 colors and ingest from your event photo library.
              </div>
            </div>
          </div>
        )}
        {isSummer && (
          <>
          <div className="px-[12px] mb-[12px] relative">
            <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[10px]">Campaign Themes</div>
            <div className="flex flex-col gap-[8px]">
              {SUMMER_THEME_ORDER.map((id) => {
                const st = SUMMER_THEMES[id];
                const mode = `summer-${id}`;
                const active = currentMode === mode;
                const tl = SUMMER_TIMELINE[id];
                const ac = st.palette.accent;
                return (
                  <button
                    key={id}
                    onClick={() => handleSetMode(mode)}
                    className="group w-full text-left rounded-[14px] cursor-pointer transition-all duration-200 overflow-hidden border"
                    style={{
                      background: active
                        ? `linear-gradient(135deg, ${ac}22, rgba(255,255,255,0.02))`
                        : 'rgba(255,255,255,0.025)',
                      borderColor: active ? `${ac}80` : 'rgba(255,255,255,0.07)',
                      boxShadow: active ? `0 8px 26px -12px ${ac}, inset 0 1px 0 rgba(255,255,255,0.05)` : 'none',
                    }}
                  >
                    {/* top accent bar */}
                    <span aria-hidden className="block h-[3px] w-full" style={{ background: active ? ac : `${ac}66` }} />
                    <div className="px-[13px] py-[11px]">
                      <div className="flex items-center gap-[9px]">
                        <span
                          aria-hidden
                          className="w-[11px] h-[11px] rounded-full shrink-0"
                          style={{ background: ac, boxShadow: active ? `0 0 0 4px ${ac}33` : 'none' }}
                        />
                        <span className={`flex-1 text-[15px] font-bold tracking-[-0.2px] truncate ${active ? 'text-white' : 'text-[#CBD5E1] group-hover:text-white'}`}>
                          {st.name}
                        </span>
                        {active && <Check className="w-[15px] h-[15px] shrink-0" strokeWidth={2.6} style={{ color: ac }} />}
                      </div>
                      <div className="flex items-center gap-[7px] mt-[8px] mb-[6px]">
                        <span
                          className="text-[9px] font-bold uppercase tracking-[0.1em] px-[7px] py-[2px] rounded-[5px]"
                          style={{ color: active ? '#0A0F1C' : ac, background: active ? ac : `${ac}1f`, border: `1px solid ${ac}55` }}
                        >
                          {tl.month}
                        </span>
                        <span className="text-[10.5px] font-medium text-[#94A3B8] tabular-nums">{tl.dates}</span>
                      </div>
                      <p className="m-0 text-[10.5px] leading-[1.4] text-[#94A3B8] line-clamp-2">{st.tagline}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="px-[12px] mb-[10px] relative">
            <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[4px] px-[12px] pb-[10px]">Sections</div>
            {SUMMER_SECTIONS.map((s) => {
              const Icon = SUMMER_SECTION_ICON[s.id];
              const active = summerSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSummerSection?.(s.id)}
                  className={`${btnBase} cursor-pointer ${active ? activeClass : inactiveClass}`}
                >
                  <Icon className={iconCls(active)} />
                  {s.label}
                </button>
              );
            })}
          </div>
          </>
        )}
        {!isLU && !isSummer && <>
        <div className="px-[12px] mb-[10px] relative">
          <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Create</div>

          {/* Brand Brain hidden from nav (route still reachable via #brand-brain) */}

          <button
            onClick={() => handleSetMode('templates')}
            className={`group relative w-full flex items-center gap-[10px] px-[14px] py-[10px] rounded-[12px] cursor-pointer border-none transition-all duration-250 ${
              currentMode === 'templates'
                ? 'bg-white/[0.05] text-white'
                : 'text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white hover:translate-x-[2px]'
            }`}
          >
            {currentMode === 'templates' && (
              <span aria-hidden className="absolute -left-[12px] top-1/2 -translate-y-1/2 w-[3px] h-[20px] bg-gradient-to-b from-[#00B2A9] to-[#2896FB] rounded-r-[4px]" />
            )}
            <span className="w-[24px] h-[24px] rounded-[7px] flex items-center justify-center bg-gradient-to-br from-[#00B2A9] via-[#2896FB] to-[#A855F7] shadow-[0_2px_8px_rgba(40,150,251,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] shrink-0">
              <Sparkles className="w-[12px] h-[12px] text-white" />
            </span>
            <span className="flex-1 text-left text-[13px] font-semibold tracking-[-0.1px]">
              Craft Magic
            </span>
          </button>

          {/* Page Lab entry hidden per request — keep workspace + route wired so we can re-enable later by restoring this button. */}
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

          <button 
            onClick={() => handleSetMode('content-army')}
            className={`${btnBase} cursor-pointer ${currentMode === 'content-army' ? activeClass : inactiveClass}`}
          >
            <MonitorPlay className={iconCls(currentMode === 'content-army')} />
            Content Army
          </button>

          <button 
            onClick={() => handleSetMode('did-you-know')}
            className={`${btnBase} cursor-pointer ${currentMode === 'did-you-know' ? activeClass : inactiveClass}`}
          >
            <Lightbulb className={iconCls(currentMode === 'did-you-know')} />
            Did You Know
          </button>

          <button
            onClick={() => handleSetMode('spotlight-sessions')}
            className={`${btnBase} cursor-pointer ${currentMode === 'spotlight-sessions' ? activeClass : inactiveClass}`}
          >
            <Mic2 className={iconCls(currentMode === 'spotlight-sessions')} />
            Spotlight Sessions
          </button>
        </div>

        <div className="px-[12px] mb-[10px] relative">
          <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Biz Dev Templates</div>

          <button 
            onClick={() => handleSetMode('bizdev-templates')}
            className={`${btnBase} cursor-pointer ${currentMode === 'bizdev-templates' ? activeClass : inactiveClass}`}
          >
            <Video className={iconCls(currentMode === 'bizdev-templates')} />
            Virtual Workshop
          </button>

          <button 
            onClick={() => handleSetMode('super-promo')}
            className={`${btnBase} cursor-pointer ${currentMode === 'super-promo' ? activeClass : inactiveClass}`}
          >
            <Gift className={iconCls(currentMode === 'super-promo')} />
            Super Promo
          </button>

          <button
            onClick={() => handleSetMode('master-class')}
            className={`${btnBase} cursor-pointer ${currentMode === 'master-class' ? activeClass : inactiveClass}`}
          >
            <GraduationCap className={iconCls(currentMode === 'master-class')} />
            Master Class
            <span className="text-[8.5px] font-bold tracking-[0.12em] uppercase text-[#FFC328] bg-[rgba(255,195,40,0.12)] border border-[rgba(255,195,40,0.30)] px-[6px] py-[2px] rounded-[4px] ml-auto">
              New
            </span>
          </button>
        </div>

        <div className="px-[12px] mb-[10px] relative">
          <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Flywheel</div>

          <button
            onClick={() => handleSetMode('growth-flywheel')}
            className={`${btnBase} cursor-pointer ${currentMode === 'growth-flywheel' ? activeClass : inactiveClass}`}
          >
            <RefreshCw className={iconCls(currentMode === 'growth-flywheel')} />
            Growth Flywheel
          </button>
        </div>

        <div className="px-[12px] mb-[10px] relative">
          <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Affiliate</div>

          <button
            onClick={() => handleSetMode('affiliate-leaderboard')}
            className={`${btnBase} cursor-pointer ${currentMode === 'affiliate-leaderboard' ? activeClass : inactiveClass}`}
          >
            <Trophy className={iconCls(currentMode === 'affiliate-leaderboard')} />
            <span className="whitespace-nowrap">Leader Board</span>
          </button>

          <button
            disabled
            className={`${btnBase} opacity-40 cursor-not-allowed ${inactiveClass}`}
            title="Coming soon"
          >
            <Megaphone className={iconCls(false)} />
            <span className="flex-1 text-left">Affiliate Blurb</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#64748B] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-[4px] px-[6px] py-[2px]">Soon</span>
          </button>
        </div>

        <div className="px-[12px] mb-[10px] relative">
          <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Email Templates</div>

          <button 
            onClick={() => handleSetMode('email-templates')}
            className={`${btnBase} cursor-pointer ${currentMode === 'email-templates' ? activeClass : inactiveClass}`}
          >
            <Mail className={iconCls(currentMode === 'email-templates')} />
            Marketing Email
          </button>
        </div>

        <div className="px-[12px] mb-[10px] relative">
          <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Backgrounds</div>

          <button 
            onClick={() => handleSetMode('zoom-backgrounds')}
            className={`${btnBase} cursor-pointer ${currentMode === 'zoom-backgrounds' ? activeClass : inactiveClass}`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className={`w-[18px] h-[18px] shrink-0 ${iconCls(currentMode === 'zoom-backgrounds')}`}>
              <path d="M5.5 7.5C4.12 7.5 3 8.62 3 10v4c0 1.38 1.12 2.5 2.5 2.5h7c1.38 0 2.5-1.12 2.5-2.5v-4c0-1.38-1.12-2.5-2.5-2.5h-7zm12.5 1l3.15-1.9A.5.5 0 0 1 21.9 7v10a.5.5 0 0 1-.75.4L18 15.5V8.5z"/>
            </svg>
            Zoom Backgrounds
          </button>

          <button
            onClick={() => handleSetMode('swoosh-backgrounds')}
            className={`${btnBase} cursor-pointer ${currentMode === 'swoosh-backgrounds' ? activeClass : inactiveClass}`}
          >
            <Video className={`w-[18px] h-[18px] shrink-0 ${iconCls(currentMode === 'swoosh-backgrounds')}`} />
            Swoosh
          </button>
        </div>

        <div className="px-[12px] mb-[10px] relative">
          <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#94a3b880] pt-[8px] px-[12px] pb-[12px]">Events</div>

          <button 
            onClick={() => handleSetMode('events')}
            className={`${btnBase} cursor-pointer ${currentMode === 'events' ? activeClass : inactiveClass}`}
          >
            <Map className={iconCls(currentMode === 'events')} />
            Customer Journey
          </button>

          <button 
            onClick={() => handleSetMode('highly-cutout')}
            className={`${btnBase} cursor-pointer ${currentMode === 'highly-cutout' ? activeClass : inactiveClass}`}
          >
            <Scissors className={iconCls(currentMode === 'highly-cutout')} />
            Highly Cutout
          </button>

          <div className={`${btnBase} ${disabledClass}`}>
            <CalendarDays className="w-[18px] h-[18px] shrink-0" />
            Event Agenda
            <span className="text-[7px] font-medium bg-white/5 px-[5px] py-[1px] rounded-[4px] ml-auto text-[#64748B] uppercase tracking-[0.5px]">Soon</span>
          </div>

          <div className={`${btnBase} ${disabledClass}`}>
            <Mic2 className="w-[18px] h-[18px] shrink-0" />
            Speaker Cards
            <span className="text-[7px] font-medium bg-white/5 px-[5px] py-[1px] rounded-[4px] ml-auto text-[#64748B] uppercase tracking-[0.5px]">Soon</span>
          </div>

          <div className={`${btnBase} ${disabledClass}`}>
            <Award className="w-[18px] h-[18px] shrink-0" />
            Certificates
            <span className="text-[7px] font-medium bg-white/5 px-[5px] py-[1px] rounded-[4px] ml-auto text-[#64748B] uppercase tracking-[0.5px]">Soon</span>
          </div>

          <div className={`${btnBase} ${disabledClass}`}>
            <Clock className="w-[18px] h-[18px] shrink-0" />
            Event Schedule
            <span className="text-[7px] font-medium bg-white/5 px-[5px] py-[1px] rounded-[4px] ml-auto text-[#64748B] uppercase tracking-[0.5px]">Soon</span>
          </div>

          <div className={`${btnBase} ${disabledClass}`}>
            <FileText className="w-[18px] h-[18px] shrink-0" />
            Event Flyer
            <span className="text-[7px] font-medium bg-white/5 px-[5px] py-[1px] rounded-[4px] ml-auto text-[#64748B] uppercase tracking-[0.5px]">Soon</span>
          </div>
        </div>
        </>}

        </div>

        <div className="mt-auto shrink-0 px-[12px] pt-[12px] pb-[20px] border-t border-white/5">
          <button
            onClick={() => window.dispatchEvent(new Event("brand-engine:replay-intro"))}
            className="w-full flex items-center gap-[12px] py-[11px] px-[14px] rounded-[16px] cursor-pointer transition-all duration-250 text-[13px] font-medium mb-[2px] text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/5 hover:translate-x-[2px]"
          >
            <PlayCircle className="w-[18px] h-[18px] shrink-0 opacity-60" />
            Take a Tour
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
          <button 
            onClick={() => handleSetMode('feature-requests')}
            className={`w-full flex items-center gap-[12px] py-[11px] px-[14px] rounded-[16px] cursor-pointer transition-all duration-250 text-[13px] font-medium mb-[2px]
              ${currentMode === 'feature-requests'
                ? 'text-white bg-gradient-to-br from-[rgba(0,178,169,0.12)] to-[rgba(40,150,251,0.08)] shadow-[0_4px_24px_rgba(0,178,169,0.1),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_0_1px_rgba(0,178,169,0.1)]'
                : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/5 hover:translate-x-[2px]'
              }`}
          >
            <MessageSquarePlus className={`w-[18px] h-[18px] shrink-0 transition-all duration-250 ${currentMode === 'feature-requests' ? 'opacity-100 drop-shadow-[0_0_4px_rgba(0,178,169,0.4)]' : 'opacity-60'}`} />
            Feature Requests
          </button>
        </div>
      </nav>
    </>
  );
}
