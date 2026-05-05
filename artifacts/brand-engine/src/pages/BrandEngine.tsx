import { useState, useEffect } from "react";
import { Sidebar } from "@/components/brand/Sidebar";
import { Toolbar } from "@/components/brand/Toolbar";
import { TemplatesWorkspace } from "@/components/brand/TemplatesWorkspace";
import { ShaunWorkspace } from "@/components/brand/ShaunWorkspace";
import { ZoomWorkspace } from "@/components/brand/ZoomWorkspace";
import { BrandDirectoryWorkspace } from "@/components/brand/BrandDirectoryWorkspace";
import { SettingsWorkspace } from "@/components/brand/SettingsWorkspace";
import { MyExportsWorkspace } from "@/components/brand/MyExportsWorkspace";
import { BizDevWorkspace } from "@/components/brand/BizDevWorkspace";
import { SuperPromo2Workspace } from "@/components/brand/SuperPromo2Workspace";
import { MasterClassWorkspace } from "@/components/brand/MasterClassWorkspace";
import { EventsWorkspace } from "@/components/brand/EventsWorkspace";
import { ContentArmyWorkspace } from "@/components/brand/ContentArmyWorkspace";
import { DidYouKnowWorkspace } from "@/components/brand/DidYouKnowWorkspace";
import { FeatureRequestBubble } from "@/components/brand/FeatureRequestBubble";
import { FeatureRequestsWorkspace } from "@/components/brand/FeatureRequestsWorkspace";
import { EmailTemplatesWorkspace } from "@/components/brand/EmailTemplatesWorkspace";
import { BrandBrainWorkspace } from "@/components/brand/BrandBrainWorkspace";
import { GrowthFlywheelWorkspace } from "@/components/brand/GrowthFlywheelWorkspace";
import { LandingPageWorkspace } from "@/components/brand/LandingPageWorkspace";
import { SwooshBackgroundWorkspace } from "@/components/brand/SwooshBackgroundWorkspace";
import { LevelUpImageLibraryWorkspace } from "@/components/brand/LevelUpImageLibraryWorkspace";
import { LevelUpComposerWorkspace } from "@/components/brand/LevelUpComposerWorkspace";
import { useBrandMode, BRAND_THEMES } from "@/components/brand/brandModeStore";
import { TutorialPopup } from "@/components/brand/TutorialPopup";

export default function BrandEngine() {
  const VALID_MODES = ["brand-brain", "templates", "landing-page", "shaun-thumbnails", "content-army", "did-you-know", "bizdev-templates", "super-promo", "master-class", "email-templates", "zoom-backgrounds", "swoosh-backgrounds", "brand-directory", "settings", "events", "feature-requests", "growth-flywheel", "image-library", "social-composer"];
  const parseHash = () => {
    const h = window.location.hash.replace("#", "");
    return VALID_MODES.includes(h) ? h : "templates";
  };
  const [currentMode, _setCurrentMode] = useState(() => parseHash());
  const setCurrentMode = (mode: string) => {
    _setCurrentMode(mode);
    window.location.hash = mode === "templates" ? "" : mode;
  };
  useEffect(() => {
    const onHashChange = () => _setCurrentMode(parseHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [craftSeedPrompt, setCraftSeedPrompt] = useState<string | null>(null);
  const [brandMode] = useBrandMode();

  // When the user toggles to LU26 mode while sitting on a HighLevel-only
  // workspace (or vice versa), bounce them to a sensible default for that
  // mode so they aren't staring at an empty surface.
  useEffect(() => {
    const luOnly = ["image-library", "social-composer"];
    const hlOnly = ["templates", "brand-brain", "landing-page", "shaun-thumbnails", "content-army", "did-you-know", "bizdev-templates", "super-promo", "master-class", "email-templates", "zoom-backgrounds", "swoosh-backgrounds", "events", "growth-flywheel"];
    if (brandMode === "levelup26" && hlOnly.includes(currentMode)) setCurrentMode("image-library");
    if (brandMode === "highlevel" && luOnly.includes(currentMode)) setCurrentMode("templates");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandMode]);

  const sendToCraft = (prompt: string) => {
    setCraftSeedPrompt(prompt);
    setCurrentMode("templates");
  };

  const activeTheme = BRAND_THEMES[brandMode];
  // Expose the active brand theme as CSS variables on the root container so
  // every surface (sidebar chips, focus rings, accents in shared components)
  // can opt into the live brand palette via var(--brand-*) without each
  // component having to import the theme object.
  const themeVars: React.CSSProperties = {
    background: activeTheme.bgDeep,
    ['--brand-primary' as never]: activeTheme.primary,
    ['--brand-accent' as never]: activeTheme.accent,
    ['--brand-cta' as never]: activeTheme.cta,
    ['--brand-bg-deep' as never]: activeTheme.bgDeep,
    ['--brand-bg-panel' as never]: activeTheme.bgPanel,
    ['--brand-font-heading' as never]: activeTheme.fontHeading,
    ['--brand-font-body' as never]: activeTheme.fontBody,
  };

  return (
    <div data-brand-mode={brandMode} className="flex h-screen w-screen relative brand-app-bg" style={themeVars}>
      <div className="absolute inset-0 brand-app-noise pointer-events-none z-0"></div>
      
      <div className="w-0 md:w-[220px] shrink-0 overflow-visible">
        <Sidebar currentMode={currentMode} setMode={setCurrentMode} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden relative z-[1]">
        <Toolbar onMenuToggle={() => setSidebarOpen(true)} />

        {currentMode === "brand-brain" && <BrandBrainWorkspace onSendToCraft={sendToCraft} />}
        {currentMode === "templates" && <TemplatesWorkspace seedPrompt={craftSeedPrompt} onConsumeSeed={() => setCraftSeedPrompt(null)} />}
        {currentMode === "landing-page" && <LandingPageWorkspace />}
        {currentMode === "shaun-thumbnails" && <ShaunWorkspace />}
        {currentMode === "content-army" && <ContentArmyWorkspace />}
        {currentMode === "did-you-know" && <DidYouKnowWorkspace />}
        {currentMode === "zoom-backgrounds" && <ZoomWorkspace />}
        {currentMode === "swoosh-backgrounds" && <SwooshBackgroundWorkspace />}
        
        {currentMode === "bizdev-templates" && <BizDevWorkspace />}
        {currentMode === "super-promo" && <SuperPromo2Workspace />}
        {currentMode === "master-class" && <MasterClassWorkspace />}
        {currentMode === "brand-directory" && <BrandDirectoryWorkspace />}
        {currentMode === "settings" && <SettingsWorkspace />}

        {currentMode === "events" && <EventsWorkspace />}
        {currentMode === "email-templates" && <EmailTemplatesWorkspace />}
        {currentMode === "feature-requests" && <FeatureRequestsWorkspace />}
        {currentMode === "growth-flywheel" && <GrowthFlywheelWorkspace />}

        {currentMode === "image-library" && <LevelUpImageLibraryWorkspace />}
        {currentMode === "social-composer" && <LevelUpComposerWorkspace />}
      </div>
      <FeatureRequestBubble />
      <TutorialPopup currentMode={currentMode} />
    </div>
  );
}
