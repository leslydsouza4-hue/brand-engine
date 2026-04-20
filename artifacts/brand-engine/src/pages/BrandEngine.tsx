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
import { EventsWorkspace } from "@/components/brand/EventsWorkspace";
import { ContentArmyWorkspace } from "@/components/brand/ContentArmyWorkspace";
import { DidYouKnowWorkspace } from "@/components/brand/DidYouKnowWorkspace";
import { FeatureRequestBubble } from "@/components/brand/FeatureRequestBubble";
import { FeatureRequestsWorkspace } from "@/components/brand/FeatureRequestsWorkspace";
import { EmailTemplatesWorkspace } from "@/components/brand/EmailTemplatesWorkspace";
import { BrandBrainWorkspace } from "@/components/brand/BrandBrainWorkspace";
import { TutorialPopup } from "@/components/brand/TutorialPopup";

export default function BrandEngine() {
  const VALID_MODES = ["brand-brain", "templates", "shaun-thumbnails", "content-army", "did-you-know", "bizdev-templates", "super-promo", "email-templates", "zoom-backgrounds", "brand-directory", "settings", "events", "feature-requests"];
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

  const sendToCraft = (prompt: string) => {
    setCraftSeedPrompt(prompt);
    setCurrentMode("templates");
  };

  return (
    <div className="flex h-screen w-screen relative bg-[#060B16] brand-app-bg">
      <div className="absolute inset-0 brand-app-noise pointer-events-none z-0"></div>
      
      <div className="w-0 md:w-[220px] shrink-0 overflow-visible">
        <Sidebar currentMode={currentMode} setMode={setCurrentMode} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden relative z-[1]">
        <Toolbar onMenuToggle={() => setSidebarOpen(true)} />

        {currentMode === "brand-brain" && <BrandBrainWorkspace onSendToCraft={sendToCraft} />}
        {currentMode === "templates" && <TemplatesWorkspace seedPrompt={craftSeedPrompt} onConsumeSeed={() => setCraftSeedPrompt(null)} />}
        {currentMode === "shaun-thumbnails" && <ShaunWorkspace />}
        {currentMode === "content-army" && <ContentArmyWorkspace />}
        {currentMode === "did-you-know" && <DidYouKnowWorkspace />}
        {currentMode === "zoom-backgrounds" && <ZoomWorkspace />}
        
        {currentMode === "bizdev-templates" && <BizDevWorkspace />}
        {currentMode === "super-promo" && <SuperPromo2Workspace />}
        {currentMode === "brand-directory" && <BrandDirectoryWorkspace />}
        {currentMode === "settings" && <SettingsWorkspace />}

        {currentMode === "events" && <EventsWorkspace />}
        {currentMode === "email-templates" && <EmailTemplatesWorkspace />}
        {currentMode === "feature-requests" && <FeatureRequestsWorkspace />}
      </div>
      <FeatureRequestBubble />
      <TutorialPopup currentMode={currentMode} />
    </div>
  );
}
